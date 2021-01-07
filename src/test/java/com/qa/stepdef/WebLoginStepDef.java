package com.qa.stepdef;
import com.qa.pages.BasePage;
import com.qa.pages.AppPublishingPage;
//import com.qa.utils.MyWebDriver;
import com.qa.utils.PropertyManager;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import org.junit.Assert;

import java.io.IOException;
import java.util.Properties;

public class WebLoginStepDef {

//    Properties props = new PropertyManager().getProps();
//    MyWebDriver myWebDriver=new MyWebDriver();
//    AppPublishingPage appPublishingPage =new AppPublishingPage();
//    BasePage basePage=new BasePage();
//
//    public WebLoginStepDef() throws IOException {
//    }
//
//    @Given("the login screen is loaded")
//    public void theLoginScreenIsLoaded() {
//
//        String expectedUrl=props.getProperty("url");
//        String actualUrl= myWebDriver.get().getCurrentUrl();
//        Assert.assertEquals(expectedUrl,actualUrl);
//    }

    @When("I login with valid login details")
    public void iLoginWithValidLoginDetails() {
//        appPublishingPage.userName.sendKeys("container.sanity@auto.nutshellapps.co.uk");
//        appPublishingPage.password.sendKeys("P455.word12");
//        appPublishingPage.loginButton.click();


    }
}
