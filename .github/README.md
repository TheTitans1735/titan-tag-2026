# GitHub Actions for Android CI/CD

This repository includes comprehensive GitHub Actions workflows for building, testing, and releasing the Android application.

## 🔄 **Workflows Overview**

### 1. **Android CI** (`android-ci.yml`)
**Triggers**: Push to main/develop, Pull Requests, Releases

**Features**:
- ✅ Build Debug APK
- ✅ Build Release APK (on releases)
- ✅ Run Unit Tests
- ✅ Run Android Lint
- ✅ Upload artifacts (APK files)
- ✅ Generate test reports
- ✅ Upload release APK to GitHub Releases

**Artifacts**:
- `debug-apk`: Debug APK (30 days retention)
- `release-apk`: Release APK (90 days retention)
- `lint-report`: Lint HTML report (7 days retention)

### 2. **Release Build** (`release-build.yml`)
**Triggers**: Manual workflow dispatch

**Features**:
- 🎛️ Choose Debug or Release build
- 📝 Custom version naming
- 🏷️ Optional Git tag creation
- 📦 Build information generation
- 🚀 Upload to GitHub Release (if tagged)

**Inputs**:
- `release_type`: debug/release
- `version_name`: Custom version (e.g., 1.0.0)
- `create_tag`: Create Git tag

### 3. **Code Quality** (`code-quality.yml`)
**Triggers**: Push to main/develop, Pull Requests

**Features**:
- 🔍 Detekt static analysis
- 🧹 Android Lint
- 🧪 Unit Tests
- 📊 SonarCloud analysis
- 📋 Comprehensive reports

**Reports**:
- Detekt reports (HTML/XML)
- Lint reports (HTML)
- Test reports (HTML/XML)
- SonarCloud analysis

## 🚀 **How to Use**

### **Automatic Builds**
- **Push to main/develop**: Triggers CI build with tests
- **Pull Request**: Runs full test suite and code quality checks
- **Release**: Builds release APK and uploads to GitHub Releases

### **Manual Release Build**
1. Go to **Actions** tab in GitHub
2. Select **Release Build** workflow
3. Click **Run workflow**
4. Choose build options:
   - **Release Type**: debug or release
   - **Version Name**: e.g., 1.0.0 (optional)
   - **Create Git Tag**: true/false (optional)
5. Download artifacts from **Actions** → **Workflow runs**

### **Release with Git Tag**
1. Run **Release Build** workflow
2. Set `create_tag` to `true`
3. Provide `version_name` (e.g., 1.0.0)
4. Workflow creates Git tag and GitHub Release
5. APK automatically attached to release

## 📊 **Artifacts & Downloads**

### **CI Build Artifacts**
- **Debug APK**: `archaeology-field-debug.apk`
- **Release APK**: `archaeology-field-release.apk` (on releases)
- **Reports**: Lint, test, and code quality reports

### **Manual Build Artifacts**
- **Named APKs**: `archaeology-field-debug-{build_number}.apk`
- **Build Info**: `build-info.md` with build details
- **GitHub Release**: APK attached to release (if tagged)

## 🔧 **Configuration**

### **Required Secrets**
- `GITHUB_TOKEN`: Automatically provided by GitHub
- `SONAR_TOKEN`: For SonarCloud analysis (optional)

### **Build Variants**
- **Debug**: For testing and development
- **Release**: Signed production build
- **Version Management**: Automatic build numbering

### **Code Quality Tools**
- **Detekt**: Kotlin static analysis
- **Android Lint**: Android-specific checks
- **Unit Tests**: JUnit + Mockito
- **SonarCloud**: Code quality analysis

## 📈 **Build Performance**

### **Caching**
- Gradle packages cached for faster builds
- Dependencies cached across runs
- ~70% faster subsequent builds

### **Parallel Execution**
- Tests run in parallel
- Multiple quality checks simultaneous
- Optimized for speed

## 🛠️ **Local Development**

### **Run Tests Locally**
```bash
./gradlew testDebugUnitTest
./gradlew lintDebug
./gradlew detekt
```

### **Build APKs Locally**
```bash
./gradlew assembleDebug
./gradlew assembleRelease
```

### **Code Quality**
```bash
./gradlew detekt
./gradlew lintDebug
```

## 📝 **Build Information**

Each build includes:
- **Build Type**: Debug/Release
- **Build Number**: GitHub Actions run number
- **Commit SHA**: Git commit hash
- **Branch**: Git branch name
- **Version**: Custom version (if provided)
- **Build Date**: UTC timestamp

## 🔍 **Troubleshooting**

### **Common Issues**
1. **Gradle Cache**: Clear cache if build fails
2. **Dependencies**: Check for dependency conflicts
3. **Permissions**: Ensure GitHub token has proper permissions
4. **SonarCloud**: Configure SONAR_TOKEN if needed

### **Debug Builds**
- Check workflow logs for errors
- Download test reports for details
- Review lint reports for issues
- Check artifact upload status

## 📞 **Support**

For issues with GitHub Actions:
1. Check **Actions** tab for workflow logs
2. Review error messages in build logs
3. Check artifact upload status
4. Verify repository permissions

---

**Note**: All workflows are configured for optimal performance and comprehensive testing. The CI/CD pipeline ensures code quality, automated testing, and reliable releases.