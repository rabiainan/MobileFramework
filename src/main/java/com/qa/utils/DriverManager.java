package com.qa.utils;

import io.appium.java_client.AppiumDriver;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.ios.IOSDriver;
import org.openqa.selenium.remote.DesiredCapabilities;

import java.io.IOException;
import java.net.URL;

public class DriverManager {


    private static ThreadLocal<AppiumDriver> driver = new ThreadLocal<>();
    TestUtils utils = new TestUtils();

    public AppiumDriver getDriver(){
        return driver.get();
    }

    public void setDriver(AppiumDriver driver2){
        driver.set(driver2);
    }



    public void initializeDriver() throws Exception {
        AppiumDriver driver = null;
        GlobalParams params = new GlobalParams();
        PropertyManager props = new PropertyManager();

        URL url;
        DesiredCapabilities caps;

        switch(System.getProperty("remoteOrLocal")){
            case "Remote":
                url = new URL("https://MeralGulap:9ffc9e26-989f-4e8d-bd36-a5875f73ac9b@api.kobiton.com/wd/hub");
                caps= new KobitonCapabilitiesManager().getCaps();
                System.out.println("REMOTE");
                break;
            case "Local":
                url = new ServerManager().getServer().getUrl();
                caps= new AppiumCapabilitiesManager().getCaps();
                System.out.println("LOCAL");
                break;
            default:
                throw new IllegalStateException("Unexpected value: " + System.getProperty("remoteOrLocal"));
        }

        if(driver == null){
            try{
                utils.log().info("initializing Appium driver");
                switch(params.getPlatformName()){
                    case "Android":

                        driver = new AndroidDriver(url, caps);
//                        URL url = new URL("http://127.0.0.1:4723/wd/hub");
//                        driver = new AndroidDriver(url, new CapabilitiesManager().getCaps());
                        break;
                    case "iOS":
                        driver = new IOSDriver(url, caps);
//                        URL url1 = new URL("http://127.0.0.1:4723/wd/hub");
//                        driver = new AndroidDriver(url1, new CapabilitiesManager().getCaps());
                        break;
                }
                if(driver == null){
                    throw new Exception("driver is null. ABORT!!!");
                }
                utils.log().info("Driver is initialized");
                this.driver.set(driver);
            } catch (IOException e) {
                e.printStackTrace();
                utils.log().fatal("Driver initialization failure. ABORT !!!!" + e.toString());
                throw e;
            }
        }

    }

}
