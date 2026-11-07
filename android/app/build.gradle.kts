import org.gradle.api.tasks.Sync
plugins { id("com.android.application") }
val syncGame by tasks.registering(Sync::class) {
    from(rootProject.projectDir.parentFile) {
        include("index.html", "styles.css", "game.css", "js/**/*.mjs", "assets/**")
    }
    into(layout.buildDirectory.dir("generated/game-assets"))
}
android {
    namespace = "dev.thapvotan.game"
    compileSdk = 35
    defaultConfig {
        applicationId = "dev.thapvotan.game"
        minSdk = 24
        targetSdk = 35
        versionCode = 49
        versionName = "1.47.0"
    }
    sourceSets["main"].assets.srcDir(layout.buildDirectory.dir("generated/game-assets"))
    buildFeatures { buildConfig = true }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
tasks.named("preBuild") { dependsOn(syncGame) }
