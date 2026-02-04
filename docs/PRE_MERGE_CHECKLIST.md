# Pre-Merge Checklist for Main Branch

Use this checklist before merging any changes to the `main` branch to ensure a smooth deployment to production.

## Quick Reference

Copy this checklist into your Pull Request description:

```markdown
## Pre-Merge Checklist

### Code Quality
- [ ] All frontend tests pass (`npm run test:unit`)
- [ ] All backend tests pass (`cd server && npm run test:unit`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Linting passes with no errors (`npm run lint` and `cd server && npm run lint`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend builds successfully (`cd server && npm run build`)
- [ ] API prefix check passes (`npm run lint:api-prefix`)

### Security
- [ ] No critical vulnerabilities (`npm audit` and `cd server && npm audit`)
- [ ] No secrets committed to repository
- [ ] Environment variables documented in `.env.example`
- [ ] Security scanning passes (if applicable)

### Documentation
- [ ] README.md is up to date
- [ ] API changes documented
- [ ] New environment variables documented
- [ ] Breaking changes documented in PR description

### Review
- [ ] Code reviewed by at least one team member
- [ ] All review comments addressed
- [ ] CI/CD pipeline passes all checks
- [ ] Manual testing completed for new features

### Database (if applicable)
- [ ] Migration scripts tested locally
- [ ] Rollback procedure documented
- [ ] Backup verified before deployment

### Deployment Plan
- [ ] Production deployment time communicated to team
- [ ] Rollback plan prepared
- [ ] Post-deployment verification steps documented
```

---

## Detailed Checklist

### 1. Code Quality Verification

#### Frontend Tests
```bash
# Run unit tests
npm run test:unit

# Expected: All tests pass, no failures
# Fix any failing tests before proceeding
```

#### Backend Tests
```bash
# Unit tests
cd server && npm run test:unit

# Integration tests (requires Docker services)
cd server && npm run test:integration

# Expected: All tests pass
```

#### End-to-End Tests
```bash
# Run E2E tests
npm run test:e2e

# Expected: All critical user flows pass
# Review playwright-report/ for any failures
```

#### Linting
```bash
# Frontend linting
npm run lint

# Backend linting  
cd server && npm run lint

# Check API prefix usage
npm run lint:api-prefix

# Expected: No errors (warnings are acceptable if documented)
```

#### Build Verification
```bash
# Frontend build
npm run build
# Expected: Successful build, dist/ folder created

# Backend build
cd server && npm run build
# Expected: Successful build, dist/ folder created

# Check build sizes
npm run analyze:bundle
# Verify bundle sizes are reasonable (< 1MB for main chunk)
```

### 2. Security Checks

#### Dependency Vulnerabilities
```bash
# Frontend audit
npm audit
npm audit --production  # Production dependencies only

# Backend audit
cd server && npm audit
cd server && npm audit --production

# Expected: No HIGH or CRITICAL vulnerabilities
# Document any MODERATE vulnerabilities and remediation plan
```

#### Secret Detection
```bash
# Check for accidentally committed secrets
git diff main | grep -iE "(api[_-]?key|secret|password|token|private[_-]?key)" || echo "✅ No secrets detected"

# Review all changed files
git diff main --name-only

# Expected: No secrets in committed files
```

#### Environment Variables
- [ ] All new environment variables added to `.env.example`
- [ ] Production values documented in `docs/PRODUCTION_ENV_VARS.md`
- [ ] Sensitive values stored securely (not in code)

### 3. Documentation Updates

#### Code Documentation
- [ ] New functions/classes have JSDoc comments
- [ ] Complex logic is explained with inline comments
- [ ] API endpoints documented with OpenAPI/Swagger annotations

#### User Documentation
- [ ] README.md updated with new features/changes
- [ ] CHANGELOG.md updated with version and changes
- [ ] User guides updated (if user-facing changes)

#### Technical Documentation
- [ ] Architecture diagrams updated (if applicable)
- [ ] API documentation reflects endpoint changes
- [ ] Environment variable changes documented
- [ ] Migration guides for breaking changes

### 4. Code Review

#### Pull Request Quality
- [ ] PR title is clear and descriptive
- [ ] PR description explains what and why
- [ ] Related issues linked (e.g., "Fixes #123")
- [ ] Breaking changes clearly marked
- [ ] Screenshots/GIFs for UI changes

#### Review Process
- [ ] At least one approval from team member
- [ ] All review comments addressed or discussed
- [ ] No unresolved conversations
- [ ] Required reviewers have approved

#### CI/CD Status
- [ ] All GitHub Actions workflows pass
- [ ] No failing checks
- [ ] Docker builds succeed (if applicable)

### 5. Manual Testing

#### Functional Testing
- [ ] New features work as expected
- [ ] Existing features still work (no regressions)
- [ ] Edge cases handled properly
- [ ] Error handling works correctly

#### Cross-Browser Testing (if frontend changes)
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

#### Performance Testing
- [ ] Page load times acceptable (< 3s)
- [ ] API response times normal (< 500ms)
- [ ] No memory leaks
- [ ] Database queries optimized

### 6. Database Changes (if applicable)

#### Migration Safety
```bash
# Test migration up
cd server && npm run migrate

# Test migration down (rollback)
cd server && npm run migrate:rollback

# Verify data integrity after migration
```

- [ ] Migration tested on local database
- [ ] Migration tested on staging database
- [ ] Rollback procedure tested
- [ ] Data backup verified before production run

#### Schema Changes
- [ ] Backward compatible (no breaking changes)
- [ ] Indexes added for new queries
- [ ] Foreign keys properly defined
- [ ] Default values set where appropriate

### 7. Deployment Preparation

#### Pre-Deployment Communication
- [ ] Team notified of deployment time
- [ ] Users notified if downtime expected
- [ ] Deployment time scheduled (avoid peak hours)
- [ ] On-call engineer available during deployment

#### Rollback Plan
- [ ] Previous version tag identified
- [ ] Rollback procedure documented
- [ ] Database rollback plan (if applicable)
- [ ] Quick rollback can be executed within 5 minutes

#### Post-Deployment Verification
- [ ] Health check endpoints documented
- [ ] Smoke tests prepared
- [ ] Monitoring dashboards ready
- [ ] Log aggregation configured

### 8. Additional Checks for Specific Changes

#### API Changes
- [ ] Backward compatible or versioned
- [ ] Breaking changes documented
- [ ] API documentation updated
- [ ] Client SDK updated (if applicable)
- [ ] Rate limiting configured

#### Frontend Changes
- [ ] Build size increase is acceptable (< 10%)
- [ ] No console errors or warnings
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] SEO meta tags updated
- [ ] PWA manifest updated (if applicable)

#### Infrastructure Changes
- [ ] Terraform/IaC changes reviewed
- [ ] Resource limits configured
- [ ] Monitoring alerts configured
- [ ] Backup procedures updated

#### Third-Party Integrations
- [ ] API keys/credentials configured
- [ ] Webhook endpoints verified
- [ ] Rate limits understood
- [ ] Error handling for service failures
- [ ] Fallback mechanisms in place

---

## Final Pre-Merge Checklist

Before clicking "Merge":

1. ✅ All checklist items above are complete
2. ✅ CI/CD pipeline is green
3. ✅ Approvals obtained
4. ✅ Branch is up to date with main
5. ✅ No merge conflicts
6. ✅ Deployment plan communicated
7. ✅ Team is ready for post-deployment verification

---

## Post-Merge Actions

Immediately after merging:

1. **Monitor Deployment**
   ```bash
   # Watch CI/CD pipeline
   # GitHub Actions: https://github.com/keokukzh/REAL-AIDevelo.ai/actions
   
   # Monitor deployment logs
   # Cloudflare: https://dash.cloudflare.com/
   # Render: https://dashboard.render.com/
   ```

2. **Verify Deployment**
   ```bash
   # Run health checks
   curl https://aidevelo.ai
   curl https://real-aidevelo-ai.onrender.com/api/health
   
   # Run smoke tests
   npm run audit:prod
   ```

3. **Monitor for Issues**
   - Watch error rates in monitoring tools
   - Check application logs for errors
   - Monitor user reports/support tickets
   - Review performance metrics

4. **Clean Up**
   ```bash
   # Delete feature branch (if auto-delete not enabled)
   git branch -d feature-branch-name
   git push origin --delete feature-branch-name
   
   # Update local main
   git checkout main
   git pull origin main
   ```

---

## Emergency Procedures

If critical issues are discovered post-deployment:

### Immediate Rollback
```bash
# 1. Revert the merge commit
git revert -m 1 <merge-commit-hash>
git push origin main

# 2. Monitor rollback deployment
# Check CI/CD pipeline and health endpoints

# 3. Communicate with team
# Notify about rollback and investigation plan
```

### Incident Response
1. Stop any ongoing deployments
2. Assess severity and impact
3. Execute rollback if critical
4. Investigate root cause
5. Prepare hotfix
6. Document incident and learnings

---

## Tips for Success

1. **Run checks early**: Don't wait until ready to merge
2. **Keep PRs small**: Easier to review and safer to deploy
3. **Test in staging**: Use preview deployments for testing
4. **Deploy during low traffic**: Minimize user impact
5. **Have backup plan**: Always know how to rollback
6. **Communicate**: Keep team informed of deployment status
7. **Monitor actively**: Watch for issues in first hour post-deployment

---

## Resources

- [Full Deployment Guide](./MERGE_TO_MAIN_AND_DEPLOY.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Production Environment Variables](./PRODUCTION_ENV_VARS.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

**Last Updated**: 2024-02-04  
**Maintained By**: DevOps Team
