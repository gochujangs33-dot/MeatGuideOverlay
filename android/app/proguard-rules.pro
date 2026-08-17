# MeatGuideOverlay Proguard Rules
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses

# Keep Gson Models
-keep class com.antigravity.meatguideoverlay.data.model.** { *; }
-keepclassmembers class com.antigravity.meatguideoverlay.data.model.** { *; }

# Keep AndroidX & Material
-keep class androidx.appcompat.** { *; }
-keep class com.google.android.material.** { *; }
