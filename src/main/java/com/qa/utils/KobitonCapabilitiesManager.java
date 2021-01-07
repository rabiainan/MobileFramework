package com.qa.utils;

import io.appium.java_client.remote.MobileCapabilityType;
import org.openqa.selenium.remote.DesiredCapabilities;

import java.io.File;
import java.io.IOException;
import java.util.Properties;

public class KobitonCapabilitiesManager {

    TestUtils utils = new TestUtils();

    public DesiredCapabilities getCaps() throws IOException {
        GlobalParams params = new GlobalParams();
        Properties props = new PropertyManager().getProps();
        DesiredCapabilities capabilities = new DesiredCapabilities();

        try {
            switch (params.getPlatformName()) {
                case "Android":


// The generated session will be visible to you only.
//                    capabilities.setCapability("appPackage", props.getProperty("androidAppPackage"));
//                    capabilities.setCapability("appActivity", props.getProperty("androidAppActivity"));
                    capabilities.setCapability("sessionName", "Automation test session");
                    capabilities.setCapability("sessionDescription", "");
                    capabilities.setCapability("deviceOrientation", "portrait");
                    capabilities.setCapability("captureScreenshots", true);
                    capabilities.setCapability("browserName", "chrome");
                    capabilities.setCapability("deviceGroup", "KOBITON");
// For deviceName, platformVersion Kobiton supports wildcard
// character *, with 3 formats: *text, text* and *text*
// If there is no *, Kobiton will match the exact text provided
                    capabilities.setCapability("deviceName", "Galaxy Tab E8.0");
                    capabilities.setCapability("platformVersion", "8.1.0");
                    capabilities.setCapability("platformName", "Android");
                    capabilities.setCapability("app","kobiton-store:115834");

//// The generated session will be visible to you only.
//                    capabilities.setCapability("sessionName", "Automation test session");
//                    capabilities.setCapability("sessionDescription", "");
//                    capabilities.setCapability("deviceOrientation", "portrait");
//                    capabilities.setCapability("captureScreenshots", true);
//                    capabilities.setCapability("browserName", "chrome");
//                    capabilities.setCapability("deviceGroup", "KOBITON");
//                    capabilities.setCapability("appPackage", props.getProperty("androidAppPackage"));
//                    capabilities.setCapability("appActivity", props.getProperty("androidAppActivity"));
//// For deviceName, platformVersion Kobiton supports wildcard
//// character *, with 3 formats: *text, text* and *text*
//// If there is no *, Kobiton will match the exact text provided
//                    capabilities.setCapability("deviceName", "Xperia XA Ultra");
//                    capabilities.setCapability("platformVersion", "7.0");
//                    capabilities.setCapability("platformName", "Android");

                    break;
                case "iOS":

// The generated session will be visible to you only.
                    capabilities.setCapability("sessionName", "Automation test session");
                    capabilities.setCapability("sessionDescription", "");
                    capabilities.setCapability("deviceOrientation", "portrait");
                    capabilities.setCapability("captureScreenshots", true);
                    capabilities.setCapability("browserName", "safari");
                    capabilities.setCapability("deviceGroup", "KOBITON");
// For deviceName, platformVersion Kobiton supports wildcard
// character *, with 3 formats: *text, text* and *text*
// If there is no *, Kobiton will match the exact text provided
                    capabilities.setCapability("deviceName", "iPhone 5s (GSM)");
                    capabilities.setCapability("platformVersion", "12.4.9");
                    capabilities.setCapability("platformName", "iOS");
                    break;
            }
            return capabilities;
        } catch (Exception e) {
            e.printStackTrace();
            utils.log().fatal("Failed to load capabilities. ABORT!!" + e.toString());
            throw e;
        }
    }
}




