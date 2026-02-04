#!/bin/bash
# Production Deployment Script
# Use this script for manual production deployments

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Parse arguments
SKIP_TESTS=false
SKIP_BUILD=false
FRONTEND_ONLY=false
BACKEND_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-tests       Skip running tests"
            echo "  --skip-build       Skip building (use existing build)"
            echo "  --frontend-only    Deploy only frontend"
            echo "  --backend-only     Deploy only backend"
            echo "  -h, --help         Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Banner
echo ""
echo "================================================"
echo "   AIDevelo.ai Production Deployment Script    "
echo "================================================"
echo ""

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_warning "You are not on the main branch (current: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_error "You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Pull latest changes
print_status "Pulling latest changes from origin..."
git pull origin main
print_success "Repository is up to date"

# Check Node version
print_status "Checking Node version..."
NODE_VERSION=$(node -v)
print_status "Node version: $NODE_VERSION"
if ! [[ $NODE_VERSION =~ ^v20 ]]; then
    print_warning "Recommended Node version is 20.x (current: $NODE_VERSION)"
fi

# Run pre-deployment checks
if [ "$SKIP_TESTS" = false ]; then
    print_status "Running pre-deployment tests..."
    
    # Frontend tests
    if [ "$BACKEND_ONLY" = false ]; then
        print_status "Running frontend tests..."
        npm run test:unit -- --run || {
            print_error "Frontend tests failed"
            exit 1
        }
        print_success "Frontend tests passed"
        
        print_status "Running frontend linting..."
        npm run lint || {
            print_error "Frontend linting failed"
            exit 1
        }
        print_success "Frontend linting passed"
    fi
    
    # Backend tests
    if [ "$FRONTEND_ONLY" = false ]; then
        print_status "Running backend tests..."
        cd server
        npm run test:unit || {
            print_error "Backend tests failed"
            exit 1
        }
        cd ..
        print_success "Backend tests passed"
        
        print_status "Running backend linting..."
        cd server
        npm run lint || {
            print_error "Backend linting failed"
            exit 1
        }
        cd ..
        print_success "Backend linting passed"
    fi
else
    print_warning "Skipping tests (--skip-tests flag set)"
fi

# Build projects
if [ "$SKIP_BUILD" = false ]; then
    if [ "$BACKEND_ONLY" = false ]; then
        print_status "Building frontend..."
        npm run build || {
            print_error "Frontend build failed"
            exit 1
        }
        print_success "Frontend build completed"
    fi
    
    if [ "$FRONTEND_ONLY" = false ]; then
        print_status "Building backend..."
        cd server
        npm run build || {
            print_error "Backend build failed"
            exit 1
        }
        cd ..
        print_success "Backend build completed"
    fi
else
    print_warning "Skipping build (--skip-build flag set)"
fi

# Deploy frontend
if [ "$BACKEND_ONLY" = false ]; then
    print_status "Deploying frontend to Cloudflare Pages..."
    
    if ! command_exists wrangler; then
        print_error "wrangler CLI not found. Install it with: npm install -g wrangler"
        exit 1
    fi
    
    if [ -z "$CF_PAGES_PROJECT_NAME" ]; then
        print_warning "CF_PAGES_PROJECT_NAME not set, using default: aidevelo-ai"
        CF_PAGES_PROJECT_NAME="aidevelo-ai"
    fi
    
    print_status "Deploying to project: $CF_PAGES_PROJECT_NAME"
    npm run deploy:cf || {
        print_error "Frontend deployment failed"
        exit 1
    }
    print_success "Frontend deployed successfully"
fi

# Deploy backend
if [ "$FRONTEND_ONLY" = false ]; then
    print_status "Triggering backend deployment..."
    
    if [ -z "$RENDER_DEPLOY_HOOK_URL" ]; then
        print_warning "RENDER_DEPLOY_HOOK_URL not set"
        print_status "To deploy backend:"
        print_status "1. Go to Render dashboard: https://dashboard.render.com/"
        print_status "2. Select your service"
        print_status "3. Click 'Manual Deploy' -> 'Deploy latest commit'"
    else
        print_status "Triggering Render deployment via webhook..."
        curl -X POST "$RENDER_DEPLOY_HOOK_URL" || {
            print_error "Failed to trigger backend deployment"
            exit 1
        }
        print_success "Backend deployment triggered"
    fi
fi

# Post-deployment verification
echo ""
print_status "Post-deployment verification..."
echo ""

if [ "$BACKEND_ONLY" = false ]; then
    FRONTEND_URL="${FRONTEND_URL:-https://aidevelo.ai}"
    print_status "Checking frontend: $FRONTEND_URL"
    
    sleep 5  # Give CDN time to update
    
    if curl -f -s "$FRONTEND_URL" > /dev/null; then
        print_success "Frontend is accessible"
    else
        print_error "Frontend is not accessible"
    fi
fi

if [ "$FRONTEND_ONLY" = false ]; then
    API_URL="${API_URL:-https://real-aidevelo-ai.onrender.com}"
    HEALTH_ENDPOINT="$API_URL/api/health"
    
    print_status "Waiting for backend to deploy..."
    sleep 30
    
    print_status "Checking backend health: $HEALTH_ENDPOINT"
    
    for i in {1..5}; do
        if curl -f -s "$HEALTH_ENDPOINT" | grep -q '"status":"ok"'; then
            print_success "Backend health check passed"
            break
        else
            if [ $i -eq 5 ]; then
                print_error "Backend health check failed after 5 attempts"
            else
                print_status "Attempt $i failed, retrying in 10s..."
                sleep 10
            fi
        fi
    done
fi

# Summary
echo ""
echo "================================================"
print_success "Deployment completed!"
echo "================================================"
echo ""
print_status "Next steps:"
echo "  1. Monitor error rates and logs"
echo "  2. Test critical user flows manually"
echo "  3. Check performance metrics"
echo "  4. Be ready to rollback if issues arise"
echo ""

if [ "$BACKEND_ONLY" = false ]; then
    print_status "Frontend URL: ${FRONTEND_URL:-https://aidevelo.ai}"
fi

if [ "$FRONTEND_ONLY" = false ]; then
    print_status "Backend URL: ${API_URL:-https://real-aidevelo-ai.onrender.com}"
fi

echo ""
print_status "For rollback instructions, see: docs/MERGE_TO_MAIN_AND_DEPLOY.md"
echo ""
