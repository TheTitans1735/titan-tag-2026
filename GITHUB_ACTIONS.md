# Archaeology Field Documentation - GitHub Actions

## 🔄 **CI/CD Pipeline Overview**

This repository includes comprehensive GitHub Actions workflows for automated building, testing, and releasing the Android application.

### **📋 Workflow Summary**

| Workflow | Trigger | Purpose | Artifacts |
|----------|---------|---------|-----------|
| **Android CI** | Push, PR, Release | Build & Test | Debug/Release APKs, Reports |
| **Release Build** | Manual | Custom Releases | Versioned APKs, GitHub Release |
| **Code Quality** | Push, PR | Quality Checks | Detekt, Lint, Test Reports |

---

## 🚀 **Quick Start**

### **Automatic Build (Push to Main)**
```bash
git push origin main
```
→ Triggers CI build with tests and artifact generation

### **Manual Release Build**
1. Go to **Actions** → **Release Build**
2. Click **Run workflow**
3. Choose options and run
4. Download artifacts from workflow run

### **Create Release with Tag**
1. Run **Release Build** workflow
2. Set `create_tag` to `true`
3. Provide `version_name` (e.g., 1.0.0)
4. APK automatically attached to GitHub Release

---

## 📦 **Artifacts & Downloads**

### **CI Build Artifacts**
- **Debug APK**: `archaeology-field-debug.apk`
- **Release APK**: `archaeology-field-release.apk`
- **Reports**: Lint, test, and quality reports

### **Manual Build Artifacts**
- **Named APKs**: `archaeology-field-debug-{build_number}.apk`
- **Build Info**: `build-info.md` with build details
- **GitHub Release**: APK attached to release (if tagged)

### **Artifact Retention**
- **Debug APKs**: 30 days
- **Release APKs**: 90 days
- **Reports**: 7 days

---

## 🔧 **Build Configuration**

### **Required Setup**
- ✅ GitHub repository with Actions enabled
- ✅ Android project structure configured
- ✅ Gradle wrapper committed
- ⚠️ `SONAR_TOKEN` (optional, for SonarCloud)

### **Build Variants**
- **Debug**: Development and testing
- **Release**: Production build (signed)
- **Version Management**: Automatic build numbering

---

## 📊 **Code Quality & Testing**

### **Automated Checks**
- ✅ **Unit Tests**: JUnit + Mockito
- ✅ **Android Lint**: Code quality checks
- ✅ **Detekt**: Kotlin static analysis
- ✅ **SonarCloud**: Code quality metrics

### **Quality Reports**
- **Detekt**: HTML/XML reports
- **Lint**: HTML report
- **Tests**: JUnit XML reports
- **SonarCloud**: Online analysis

---

## 🛠️ **Local Development Commands**

### **Build Commands**
```bash
# Build Debug APK
./gradlew assembleDebug

# Build Release APK
./gradlew assembleRelease

# Run Tests
./gradlew testDebugUnitTest

# Run Lint
./gradlew lintDebug

# Run Detekt
./gradlew detekt
```

### **Quality Checks**
```bash
# All quality checks
./gradlew check

# Clean build
./gradlew clean build
```

---

## 📈 **Performance Optimizations**

### **Caching Strategy**
- **Gradle Packages**: Cached for faster builds
- **Dependencies**: Shared across workflow runs
- **Build Time**: ~70% faster subsequent builds

### **Parallel Execution**
- **Tests**: Run in parallel
- **Quality Checks**: Simultaneous execution
- **Optimized**: For speed and reliability

---

## 🔍 **Monitoring & Debugging**

### **Build Status**
- **GitHub Actions Tab**: Real-time build status
- **Workflow Logs**: Detailed error information
- **Artifacts Section**: Download build outputs
- **Reports Section**: Quality analysis results

### **Common Issues**
1. **Gradle Cache**: Clear if build fails
2. **Dependencies**: Check for conflicts
3. **Permissions**: Verify GitHub token access
4. **SonarCloud**: Configure SONAR_TOKEN

---

## 📝 **Release Process**

### **Automated Release (Tag)**
1. Create and push tag: `git tag v1.0.0 && git push origin v1.0.0`
2. GitHub Actions triggers release build
3. Release APK generated and attached
4. GitHub Release created automatically

### **Manual Release**
1. Run **Release Build** workflow
2. Choose release type and version
3. Optional: Create Git tag
4. Download artifacts or GitHub Release

### **Release Information**
Each release includes:
- **Version Number**: Custom or auto-generated
- **Build Number**: GitHub Actions run number
- **Commit SHA**: Source code reference
- **Build Date**: Release timestamp
- **Changelog**: Build information

---

## 🎯 **Best Practices**

### **Branch Strategy**
- **main**: Production-ready code
- **develop**: Integration branch
- **feature/***: Feature development
- **hotfix/***: Critical fixes

### **Commit Guidelines**
- Use descriptive commit messages
- Follow conventional commit format
- Include issue numbers when applicable
- Sign commits for verification

### **Quality Gates**
- All tests must pass
- Lint warnings should be addressed
- Code quality score maintained
- Security scans pass

---

## 📞 **Support & Troubleshooting**

### **Getting Help**
1. **Workflow Logs**: Check Actions tab for errors
2. **Build Reports**: Download and review reports
3. **GitHub Issues**: Report repository issues
4. **Documentation**: Review this README

### **Common Solutions**
- **Clear Gradle Cache**: `./gradlew clean`
- **Update Dependencies**: Check for newer versions
- **Verify Permissions**: Ensure Actions enabled
- **Check Configuration**: Review workflow files

---

**🎉 Happy Building!**

This CI/CD pipeline ensures reliable, high-quality builds with comprehensive testing and automated releases. The system is designed for efficiency, maintainability, and ease of use.