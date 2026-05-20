Opal Client (mock)
===================

A minimal Fabric mod skeleton to test launcher injection and config file reading.

Requirements
------------
- Java 17 JDK
- Gradle (or use Gradle wrapper if you add it)
- Internet connection to download Fabric/Minecraft mappings and dependencies

Build
-----
Run from `mock/opalclient-src`:

```bash
gradle build
```

The mod jar will be generated at `build/libs/opalclient-0.0.1.jar`.

Testing with the launcher
------------------------
1. Ensure launcher `pluginOpalClient` is enabled in settings.
2. Put the built `opalclient-0.0.1.jar` into `mock/opalclient/opalclient.jar` (or publish a real release and let the plugin download it).
3. Launch a Fabric-enabled instance from the launcher. The plugin will install the jar into the instance `mods` folder and write `config/opalclient.json`.
4. Check the plugin temp log at the launcher temp path (see launcher `kTempDataPath`), or the Minecraft client log for `[opal mock]` messages when pressing Right Shift.

Notes
-----
- This is a minimal mock implementation for quick integration testing. Replace and extend with real overlay/HUD code later.
- If you prefer, add a Gradle wrapper (`gradlew`) to the project for reproducible builds.
