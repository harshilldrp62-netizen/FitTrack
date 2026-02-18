// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "FittrackHealthSteps",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "FittrackHealthSteps",
            targets: ["HealthStepsPluginPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "HealthStepsPluginPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/HealthStepsPluginPlugin"),
        .testTarget(
            name: "HealthStepsPluginPluginTests",
            dependencies: ["HealthStepsPluginPlugin"],
            path: "ios/Tests/HealthStepsPluginPluginTests")
    ]
)