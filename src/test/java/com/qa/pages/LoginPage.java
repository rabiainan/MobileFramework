package com.qa.pages;

import com.qa.utils.PropertyManager;
import io.appium.java_client.MobileElement;
import io.appium.java_client.pagefactory.AndroidFindBy;
import io.appium.java_client.pagefactory.iOSXCUITFindBy;
import io.cucumber.java.en.And;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import java.io.IOException;
import java.util.Properties;
import java.util.Set;

public class LoginPage extends BasePage {

    Properties props = new PropertyManager().getProps();

    @FindBy (id="mainLogo")
    public WebElement loginMainLogo;

    @FindBy(xpath = "//input[@id='form_domain']")
    //@AndroidFindBy(xpath = "//android.widget.EditText[@content-desc=\"account\"]")
    //@AndroidFindBy(accessibility = "account")
    //@iOSXCUITFindBy(iOSNsPredicate = "type == 'XCUIElementTypeTextField' AND value == 'Account' AND visible == 1")
    public WebElement account;

    @FindBy(xpath = "//*[@id=\"form_username\"]")
    //@AndroidFindBy(xpath = "//android.widget.EditText[@content-desc=\"Username\"]")
    //@iOSXCUITFindBy (iOSNsPredicate = "type == 'XCUIElementTypeTextField' AND value == 'Username' AND visible == 1")
    public WebElement username;

    @FindBy(xpath = "//*[@id=\"form_password\"]")
    //@AndroidFindBy(xpath = "//android.webkit.WebView[@content-desc=\"Nutshell Forms\"]/android.view.View[4]/android.widget.EditText")
    //@iOSXCUITFindBy (iOSNsPredicate ="type == 'XCUIElementTypeSecureTextField' AND visible == 1" )
    public WebElement password;

    @FindBy(xpath = "//*[@id=\"sign_in\"]")
    //@AndroidFindBy(xpath = "//android.widget.Button[@content-desc=\"Sign In\"]")
    //@iOSXCUITFindBy (accessibility = ("Sign In"))
    public WebElement signIn;

    public LoginPage() throws InterruptedException, IOException {
    }
    public void login() throws InterruptedException {

        String account_field = props.getProperty("account");
        String username_field = props.getProperty("username");
        String password_field = props.getProperty(("password"));
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        waitForVisibility(account);
        account.sendKeys(account_field);
        username.sendKeys(username_field);
        password.sendKeys(password_field);
        waitForVisibility(signIn);
        signIn.click();
    }
}
