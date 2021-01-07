package com.qa.pages;

import com.qa.utils.PropertyManager;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;

import java.io.IOException;
import java.util.Properties;

public class AppPublishingPage extends BasePage {

    public AppPublishingPage() throws IOException {
    }

    Properties props = new PropertyManager().getProps();

    @FindBy(id = "username")
    public WebElement userName;

    @FindBy(id = "password")
    public WebElement password;

    @FindBy(name = "submit")
    public WebElement loginButton;

    @FindBy(xpath ="//body/div[@id='outer']/div[@id='body']/div[1]/form[1]/div[1]/p[1]/img[1]")
    public WebElement loginScreenImage;

    @FindBy(xpath = "//div[contains(text(),'Your username or password is incorrect.')]")
    public WebElement hiddenElement_username;

    @FindBy(xpath="//div[contains(text(),'Please enter your password.')]")
    public WebElement hiddenElement_password;

    @FindBy(id="forgotten_password")
    public WebElement resetButton;

    @FindBy(xpath="//div[contains(text(),'Login denied.')]")
    public WebElement warningMessageUserLogin;

    @FindBy(xpath = "//div[contains(text(),'A link to reset your password has been e-mailed to')]")
    public WebElement messageForAfterResetPassword;

    @FindBy(id="breadcrumb")
    public WebElement HomeText;


    public void login(String userNameStr, String passwordStr) {
        userName.sendKeys(userNameStr);
        password.sendKeys(passwordStr);
        loginButton.click();
    }

    public void loginWithConfig () {
        userName.sendKeys(props.getProperty("username"));
        password.sendKeys(props.getProperty("password"));
        loginButton.click();
    }

    @FindBy(xpath = "//p[contains(text(),'Urgent Tickets')]")
    public WebElement urgentTickets ;

    @FindBy(xpath = "//a[contains(text(),'Apps')]")
    public WebElement apps;

    @FindBy(xpath = "//div[@id='folder_675']")
    public WebElement QAREVIEW_folder;

    @FindBy(xpath = "//span[contains(text(),'QA REVIEW')]")
    public WebElement youAreInQaReviewFolder;

    @FindBy(xpath = "//div[@id='folder_704']")
    public WebElement containerSanity_folder;

    @FindBy(xpath = "//span[contains(text(),'Container Sanity')]")
    public WebElement youAreInContainerSanityFolder;

    @FindBy(xpath = "//div[@id='folder_717']")
    public WebElement mobile_folder;

    @FindBy(xpath = "//span[contains(text(),'Mobile')]")
    public WebElement youAreInMobileFolder;

    @FindBy(xpath = "//div[@id='microapp_2681']")
    public WebElement  sanityMobileApp01Preview;

    @FindBy(xpath = "//div[@id='current-workflow-name']")
    public WebElement  currentWorkflowName;

    @FindBy(xpath = "//button[@id='workflow_publish']")
    public WebElement  publishButton;

    @FindBy(xpath = "//div[@id='workflow_dialog_popup']")
    public WebElement  workflowDialogPopup;

    @FindBy(xpath = "//input[@id='device_preview']")
    public WebElement  publishingModeOnlyMe;



}
