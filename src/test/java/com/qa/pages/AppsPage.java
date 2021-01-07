package com.qa.pages;

import io.appium.java_client.pagefactory.AndroidFindBy;
import io.appium.java_client.pagefactory.iOSXCUITFindBy;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import java.io.IOException;

public class AppsPage extends BasePage {
    public AppsPage() throws IOException {
    }

    @FindBy(xpath= "//div[@id='microapp_2682']/div/div[2]")
    //@AndroidFindBy(xpath = "//android.webkit.WebView[@content-desc=\"My Forms\"]/android.view.View[2]/android.view.View[3]")
    //@AndroidFindBy(accessibility = "Sanity: Mobile App 01 (preview)")
    //@iOSXCUITFindBy(xpath = "//XCUIElementTypeOther[@name=\"My Forms\"]/XCUIElementTypeOther[4]/XCUIElementTypeOther[3]")
    public WebElement  SanityMobileApp01preview;

    @FindBy(xpath = "//div[@id='microapp_2682']/div/div[2]")
    public WebElement  SanityMobileApp02preview;

}
