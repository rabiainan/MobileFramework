package com.qa.pages;

import io.appium.java_client.pagefactory.AndroidFindBy;
import io.appium.java_client.pagefactory.iOSXCUITFindBy;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import java.io.IOException;

public class ContainerSanityPage extends BasePage {
    public ContainerSanityPage() throws IOException {
    }

    @FindBy(xpath = "//div[@id=\"popup-buttons\"]/button[1]")
    //@AndroidFindBy(accessibility = "Close")
    // @AndroidFindBy(xpath = "//android.widget.Button[@content-desc=\"Close\"]")
    // @iOSXCUITFindBy(accessibility = "Close")
    //@iOSXCUITFindBy(xpath = "//XCUIElementTypeButton[@name=\"Close\"]")
    public WebElement syncClose;

    @FindBy(xpath = "(//input[@id=\"test\"])[1]")
    //@AndroidFindBy(id = "test")
    //@iOSXCUITFindBy(iOSClassChain = "**/XCUIElementTypeOther[`value == '0'`][1]")
    public WebElement test_appMode; //Which app mode would you like to open?

    @FindBy(xpath = "(//input[@id=\"live\"])[1]")
    //@AndroidFindBy(id = "live")
    //@iOSXCUITFindBy(iOSClassChain = "**/XCUIElementTypeOther[`value == '0'`][2]")
    public WebElement live_appMode; //Which app mode would you like to open?

    @FindBy(xpath = "//button[@id=\"selectAppModeBtn\"]")
    //@AndroidFindBy(id = "selectAppModeBtn")
    //@iOSXCUITFindBy(accessibility =  "Open App")
    public WebElement openAppButton; //Which app mode would you like to open?

    @FindBy(xpath ="//p[contains(text(),'Sanity App 1 loaded')]" )
    //@AndroidFindBy(xpath ="(//div[@class='text_container'])[1]")
    //@iOSXCUITFindBy(accessibility = "Sanity App 1 loaded")
    public WebElement SanityApp1Loaded;

    @FindBy(xpath = "//p[contains(text(),'Preview mode only')]")
    //@AndroidFindBy(xpath = "(//div[@class='text_container'])[2]")
    //@iOSXCUITFindBy(accessibility = "Preview mode only")
    public WebElement PreviewModeOnly;

    @FindBy(xpath ="//p[contains(text(),'Sanity App 2 loaded')]" )
    public WebElement SanityApp2Loaded;

    @FindBy(xpath = "//p[contains(text(),'Test mode only')]")
    public WebElement TestModeOnly;










}
