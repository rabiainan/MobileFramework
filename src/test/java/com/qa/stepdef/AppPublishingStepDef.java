package com.qa.stepdef;

import com.qa.pages.BasePage;
import com.qa.pages.AppPublishingPage;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import java.io.IOException;

public class AppPublishingStepDef {
    AppPublishingPage appPublishingPage =new AppPublishingPage();
    BasePage basePage=new BasePage();

    public AppPublishingStepDef() throws IOException {
    }

    @Then("user navigate to config URL")
    public void userNavigateToConfigURL() throws IOException {
        BasePage basePage=new BasePage();
        basePage.getURL();
    }

    @When("I am on the dashboard")
    public void iAmOnTheDashboard() {
        Assert.assertTrue(appPublishingPage.urgentTickets.isDisplayed());
    }

    @Given("I click the Apps button")
    public void iClickTheAppsButton() {
        basePage.waitForVisibility(appPublishingPage.urgentTickets);
        appPublishingPage.apps.click();
    }

    @When("I am on the app directory page")
    public void iAmOnTheAppDirectoryPage() {
        Assert.assertTrue(appPublishingPage.HomeText.isDisplayed());
        System.out.println("Home = " + appPublishingPage.HomeText.getText());
    }

    @Given("I click the QA REVIEW folder")
    public void iClickTheQAREVIEWFolder() {
        basePage.click(appPublishingPage.QAREVIEW_folder);
    }

    @When("I am on the QA REVIEW folder")
    public void iAmOnTheQAREVIEWFolder() {
        Assert.assertTrue(appPublishingPage.youAreInQaReviewFolder.isDisplayed());
        System.out.println("Home = " + appPublishingPage.youAreInQaReviewFolder.getText());
    }

    @Given("I click the Container Sanity folder")
    public void iClickTheContainerSanityFolder() {
        basePage.click(appPublishingPage.containerSanity_folder);
    }

    @When("I am on the Container Sanity folder")
    public void iAmOnTheContainerSanityFolder() {
        Assert.assertTrue(appPublishingPage.youAreInContainerSanityFolder.isDisplayed());
        System.out.println("Home = " + appPublishingPage.youAreInContainerSanityFolder.getText());
    }

    @Given("I click the Mobile folder")
    public void iClickTheMobileFolder() {
        basePage.click(appPublishingPage.mobile_folder);
    }

    @Then("Qa Review folder is displayed")
    public void qaReviewFolderIsDisplayed() {
        Assert.assertTrue(appPublishingPage.QAREVIEW_folder.isDisplayed());
    }

    @Then("Container Sanity folder is displayed")
    public void containerSanityFolderIsDisplayed() {
        Assert.assertTrue(appPublishingPage.containerSanity_folder.isDisplayed());
    }

    @Then("Mobile folder is displayed")
    public void mobileFolderIsDisplayed() {
        Assert.assertTrue(appPublishingPage.mobile_folder.isDisplayed());
    }

    @Then("I am in the Mobile folder")
    public void iAmInTheMobileFolder() {
        Assert.assertTrue(appPublishingPage.youAreInMobileFolder.isDisplayed());
        System.out.println("Home = " + appPublishingPage.youAreInMobileFolder.getText());
    }

    @Given("I click the Sanity: Mobile AppPreview")
    public void iClickTheSanityMobileAppPreview() {
        basePage.click(appPublishingPage.sanityMobileApp01Preview);
    }

    @Then("I am in the Sanity: Mobile AppPreview")
    public void iAmInTheSanityMobileAppPreview() {
        String actualResult= appPublishingPage.currentWorkflowName.getText();
        String expectResult="Sanity: Mobile App 01 (preview)";
        Assert.assertEquals(expectResult,actualResult);
    }

    @When("I am in the builder")
    public void iAmInTheBuilder() {
        Assert.assertTrue(appPublishingPage.publishButton.isDisplayed());
    }

    @Given("I click the publish button")
    public void iClickThePublishButton() {
        basePage.click(appPublishingPage.publishButton);
    }

    @Then("The workflow dialog popup is opened")
    public void theWorkflowDialogPopupIsOpened() {
        Assert.assertTrue(appPublishingPage.workflowDialogPopup.isDisplayed());
    }
}
