/**
 * Android Build Configuration & Helper Module
 * 
 * Provides templates and utilities for Capacitor-based Android builds:
 *   - build.gradle configuration for latest SDK compatibility
 *   - AndroidManifest.xml template with required permissions
 *   - ProGuard/R8 rules for code shrinking & obfuscation
 *   - Build commands for APK (testing) and AAB (Play Store)
 */

// ─── Android SDK Configuration ───

export const ANDROID_CONFIG = {
  compileSdkVersion: 35,
  targetSdkVersion: 35,
  minSdkVersion: 24,
  buildToolsVersion: "35.0.0",
  kotlinVersion: "1.9.24",
  gradlePluginVersion: "8.7.3",
  versionCode: 1,
  versionName: "1.0.0",
  applicationId: "app.lovable.d43bea34478245bd90897a09a7edc859",
} as const;

// ─── Gradle Template ───

export const BUILD_GRADLE_APP = `plugins {
    id 'com.android.application'
    id 'kotlin-android'
}

android {
    namespace "${ANDROID_CONFIG.applicationId}"
    compileSdk ${ANDROID_CONFIG.compileSdkVersion}

    defaultConfig {
        applicationId "${ANDROID_CONFIG.applicationId}"
        minSdk ${ANDROID_CONFIG.minSdkVersion}
        targetSdk ${ANDROID_CONFIG.targetSdkVersion}
        versionCode ${ANDROID_CONFIG.versionCode}
        versionName "${ANDROID_CONFIG.versionName}"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        release {
            // Keystore credentials loaded from local.properties or env vars
            if (project.hasProperty('SIROU_KEYSTORE_PATH')) {
                storeFile file(project.property('SIROU_KEYSTORE_PATH'))
                storePassword project.property('SIROU_KEYSTORE_PASSWORD')
                keyAlias project.property('SIROU_KEY_ALIAS')
                keyPassword project.property('SIROU_KEY_PASSWORD')
            }
        }
    }

    buildTypes {
        debug {
            debuggable true
            minifyEnabled false
        }
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = '17'
    }

    lint {
        abortOnError false
        checkReleaseBuilds true
    }
}

dependencies {
    implementation "androidx.core:core-ktx:1.15.0"
    implementation "androidx.appcompat:appcompat:1.7.0"
    implementation "com.google.android.material:material:1.12.0"
    
    // Capacitor
    implementation project(':capacitor-android')

    // Biometrics
    implementation "androidx.biometric:biometric:1.2.0-alpha05"

    // Testing
    testImplementation "junit:junit:4.13.2"
    androidTestImplementation "androidx.test.ext:junit:1.2.1"
    androidTestImplementation "androidx.test.espresso:espresso-core:3.6.1"
}
`;

// ─── ProGuard Rules ───

export const PROGUARD_RULES = `# Sirou Factory — ProGuard/R8 Rules
# Keep Capacitor bridge
-keep class com.getcapacitor.** { *; }
-keep class app.lovable.** { *; }

# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep biometric classes
-keep class androidx.biometric.** { *; }

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# General Android rules
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
-dontwarn okhttp3.**
-dontwarn javax.annotation.**
`;

// ─── AndroidManifest Template ───

export const ANDROID_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

    <!-- Biometric hardware feature (not required, graceful fallback) -->
    <uses-feature android:name="android.hardware.fingerprint" android:required="false" />
    <uses-feature android:name="android.hardware.camera" android:required="false" />

    <application
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="\${usesCleartextTraffic}"
        android:networkSecurityConfig="@xml/network_security_config">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:theme="@style/AppTheme.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Capacitor file provider -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>
    </application>
</manifest>
`;

// ─── Build Command Reference ───

export interface AndroidBuildConfig {
  buildType: "debug" | "release";
  outputFormat: "apk" | "aab";
  signRelease: boolean;
}

/**
 * Returns the shell commands needed to build the Android app.
 * These run locally after `git pull` and `npx cap sync android`.
 */
export function getAndroidBuildCommands(config: AndroidBuildConfig): string[] {
  const commands: string[] = [
    "# 1. Build web assets",
    "npm run build",
    "",
    "# 2. Sync to Android",
    "npx cap sync android",
    "",
  ];

  if (config.outputFormat === "apk") {
    if (config.buildType === "debug") {
      commands.push(
        "# 3. Build debug APK (for testing)",
        "cd android && ./gradlew assembleDebug",
        "",
        "# Output: android/app/build/outputs/apk/debug/app-debug.apk"
      );
    } else {
      commands.push(
        "# 3. Build signed release APK",
        "cd android && ./gradlew assembleRelease",
        "",
        "# Output: android/app/build/outputs/apk/release/app-release.apk"
      );
    }
  } else {
    commands.push(
      "# 3. Build AAB for Play Store",
      "cd android && ./gradlew bundleRelease",
      "",
      "# Output: android/app/build/outputs/bundle/release/app-release.aab"
    );
  }

  return commands;
}

/**
 * Generate a complete Android build guide as a downloadable text file.
 */
export function generateAndroidBuildGuide(): string {
  const debugCmds = getAndroidBuildCommands({ buildType: "debug", outputFormat: "apk", signRelease: false });
  const releaseCmds = getAndroidBuildCommands({ buildType: "release", outputFormat: "apk", signRelease: true });
  const aabCmds = getAndroidBuildCommands({ buildType: "release", outputFormat: "aab", signRelease: true });

  return `# Sirou Factory — Android Build Guide
# Generated: ${new Date().toISOString()}
# App ID: ${ANDROID_CONFIG.applicationId}
# Target SDK: ${ANDROID_CONFIG.targetSdkVersion}
# Min SDK: ${ANDROID_CONFIG.minSdkVersion}

## Prerequisites
- Node.js 20+
- Android Studio (latest stable)
- JDK 17+
- Android SDK ${ANDROID_CONFIG.compileSdkVersion}

## Initial Setup (one-time)
\`\`\`bash
git clone <your-repo-url>
cd sirou-guardian-factory
npm install
npx cap add android
npx cap sync android
\`\`\`

## Debug APK (Testing)
\`\`\`bash
${debugCmds.filter(l => !l.startsWith("#") && l.trim()).join("\n")}
\`\`\`
Output: \`android/app/build/outputs/apk/debug/app-debug.apk\`
Install on device: \`adb install app-debug.apk\`

## Signed Release APK
\`\`\`bash
# Set keystore in android/local.properties:
# SIROU_KEYSTORE_PATH=../keystore/release.jks
# SIROU_KEYSTORE_PASSWORD=<password>
# SIROU_KEY_ALIAS=sirou
# SIROU_KEY_PASSWORD=<password>

${releaseCmds.filter(l => !l.startsWith("#") && l.trim()).join("\n")}
\`\`\`

## AAB for Google Play Store
\`\`\`bash
${aabCmds.filter(l => !l.startsWith("#") && l.trim()).join("\n")}
\`\`\`
Output: \`android/app/build/outputs/bundle/release/app-release.aab\`

## Generate Keystore (first time)
\`\`\`bash
keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias sirou
\`\`\`

## ProGuard
R8 minification and obfuscation is enabled for release builds.
Custom rules are in \`android/app/proguard-rules.pro\`.
`;
}
