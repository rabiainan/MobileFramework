package com.qa.stepdef;

import com.qa.pages.BasePage;
import com.qa.pages.ContainerSanityPage;
import com.qa.pages.LoginPage;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.jsoup.Connection;
import org.junit.Assert;

import java.io.IOException;

public class LoginStepDef {
    LoginPage loginPage=new LoginPage();
    ContainerSanityPage containerSanityPage=new ContainerSanityPage();
    BasePage basePage=new BasePage();


    public LoginStepDef() throws IOException, InterruptedException {
    }

    @Given("User login succesfully")
    public void UserLoginSuccesfully() throws InterruptedException, IOException {
        loginPage.login();

    }

    @When("I am in the login screen")
    public void iAmInTheLoginScreen() {
//        Assert.assertTrue(loginPage.loginMainLogo.isDisplayed());
        Assert.assertTrue(loginPage.account.isEnabled());
    }

    @Then("I am login succesfully with config values")
    public void iAmLoginSuccesfullyWithConfigValues() throws InterruptedException {
        loginPage.login();
    }

    @And("I've seen Sync Complete! pop up screen")
    public void iVeSeenSyncCompletePopUpScreen() {
        containerSanityPage.waitForVisibility_longTime (containerSanityPage.syncClose);
        Assert.assertTrue(containerSanityPage.syncClose.isDisplayed());
    }

    @When("I enter account as {string}")
    public void iEnterAccountAs(String account) {
        loginPage.waitForVisibility_longTime(loginPage.account);
        loginPage.account.sendKeys(account);
    }

    @And("I enter username as {string}")
    public void iEnterUsernameAs(String username) {
        loginPage.username.sendKeys(username);
    }

    @And("I enter password as {string}")
    public void iEnterPasswordAs(String password) {
        loginPage.password.sendKeys(password);
    }

    @And("I login")
    public void iLogin() {
        basePage.waitForVisibility(loginPage.signIn);
        loginPage.signIn.click();
    }
}
