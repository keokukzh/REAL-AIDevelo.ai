## Description

<!-- Provide a brief description of the changes in this PR -->

## Related Issues

<!-- Link to related issues: Fixes #123, Relates to #456 -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring
- [ ] Configuration change

## Changes Made

<!-- List the key changes made in this PR -->

-
-
-

## Testing Performed

<!-- Describe the testing you've done -->

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

## Breaking Changes

<!-- List any breaking changes and migration steps -->

None / N/A

---

## Pre-Merge Checklist

Before requesting review, ensure the following:

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
- [ ] Code is ready for review
- [ ] Self-review completed
- [ ] Comments added to explain complex logic
- [ ] No commented-out code or debug statements

### Database (if applicable)
- [ ] Migration scripts tested locally
- [ ] Rollback procedure documented
- [ ] Backup verified before deployment

---

## Reviewer Notes

<!-- Any specific areas you'd like reviewers to focus on -->

## Post-Merge Checklist

After merging, the reviewer/author should:

- [ ] Monitor CI/CD deployment
- [ ] Verify health checks pass
- [ ] Monitor error rates and logs
- [ ] Test critical user flows in production
- [ ] Delete feature branch

---

## Additional Context

<!-- Any additional context or information about the PR -->

---

**📚 Documentation Reference:**
- [Pre-Merge Checklist](docs/PRE_MERGE_CHECKLIST.md)
- [Merge to Main and Deploy Guide](docs/MERGE_TO_MAIN_AND_DEPLOY.md)
- [Deployment Guide](docs/DEPLOY.md)
