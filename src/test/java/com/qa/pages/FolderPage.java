package com.qa.pages;

import io.appium.java_client.pagefactory.AndroidFindBy;
import io.appium.java_client.pagefactory.iOSXCUITFindBy;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import java.io.IOException;

public class FolderPage extends BasePage {
    public FolderPage() throws IOException {
    }

    @FindBy(xpath = "//div[@id=\"folder_675\"]/div/div[2]")
    //@iOSXCUITFindBy(xpath ="//XCUIElementTypeOther[@name=\"My Forms\"]/XCUIElementTypeOther[4]/XCUIElementTypeOther[1]")
    //@AndroidFindBy(xpath = "//android.webkit.WebView[@content-desc=\"My Forms\"]/android.view.View[2]/android.view.View[1]")
    //@AndroidFindBy(accessibility = "QA REVIEW")
    public WebElement QaReview;

    @FindBy(xpath = "//div[@id=\"folder_704\"]/div/div[2]")
    //@AndroidFindBy(xpath ="//android.webkit.WebView[@content-desc=\"My Forms\"]/android.view.View[2]/android.view.View[3]")
    //@iOSXCUITFindBy(xpath ="//XCUIElementTypeOther[@name=\"My Forms\"]/XCUIElementTypeOther[4]/XCUIElementTypeOther[3]")
    public WebElement ContainerSanity;

    @FindBy(xpath = "//div[@id=\"folder_717\"]/div/div[2]")
    //@iOSXCUITFindBy(iOSClassChain = "**/XCUIElementTypeOther[`label == \"My Forms\"`]/XCUIElementTypeOther[4]/XCUIElementTypeOther[3]")
    //@AndroidFindBy(xpath = "//android.webkit.WebView[@content-desc=\"My Forms\"]/android.view.View[2]/android.view.View[3]")
    public WebElement Mobile;





}
