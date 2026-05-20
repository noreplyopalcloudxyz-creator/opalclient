package xyz.opalclient;

import com.google.gson.JsonElement;
import com.google.gson.JsonParser;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.util.InputUtil;
import org.lwjgl.glfw.GLFW;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class OpalClientMod implements ClientModInitializer {
    private static final Logger LOGGER = LoggerFactory.getLogger("opalclient");
    private KeyBinding key;

    @Override
    public void onInitializeClient() {
        LOGGER.info("OpalClientMod initializing (mock)");
        // Register Right Shift keybind
        key = KeyBindingHelper.registerKeyBinding(new KeyBinding(
                "key.opalclient.toggle",
                InputUtil.Type.KEYSYM,
                GLFW.GLFW_KEY_RIGHT_SHIFT,
                "category.opalclient"
        ));

        // Spawn a background thread to watch config file for demo
        Path config = FabricLoader.getInstance().getGameDir().resolve("config").resolve("opalclient.json");
        new Thread(() -> {
            try {
                while (true) {
                    if (Files.exists(config)) {
                        try {
                            String content = Files.readString(config);
                            JsonElement j = JsonParser.parseString(content);
                            LOGGER.info("[opal mock] config: {}", j.toString());
                        } catch (IOException ex) {
                            LOGGER.warn("Failed to read opalclient config", ex);
                        }
                    }
                    Thread.sleep(3000);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }, "opalclient-config-watcher").start();

        // Log key press using client tick (lightweight)
        net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents.END_CLIENT_TICK.register(client -> {
            while (key.wasPressed()) {
                LOGGER.info("[opal mock] Right Shift pressed - toggle overlay (mock)");
            }
        });
    }
}
