package com.qa.stepdef;

import com.qa.pages.AppsPage;
import com.qa.pages.ContainerSanityPage;
import com.qa.pages.FolderPage;
import com.qa.utils.DriverManager;
import io.appium.java_client.MobileElement;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.Assert;

import java.io.IOException;

public class ContainerSanityDef  {

    ContainerSanityPage containerSanityPage=new ContainerSanityPage();
    AppsPage appsPage=new AppsPage();
    FolderPage folderPage=new FolderPage();
    DriverManager driverManager=new DriverManager();

    public ContainerSanityDef() throws IOException {
    }


    @When("Click syncClose button")
    public void clickSyncCloseButton() throws InterruptedException {

       containerSanityPage.waitForVisibility_longTime (containerSanityPage.syncClose);
        System.out.println("!!!!CLOSE BUTTON is display="+containerSanityPage.syncClose.isDisplayed());
        containerSanityPage.click((MobileElement) containerSanityPage.syncClose,"close");

    }


    @And("Click QA REVIEW folder")
    public void clickQAREVIEWFolder() throws InterruptedException {
        Thread.sleep(3000);
        containerSanityPage.waitForClickable(folderPage.QaReview);
        folderPage.QaReview.click();

    }

    @And("Click Container Sanity folder")
    public void clickContainerSanityFolder() throws InterruptedException {
        folderPage.ContainerSanity.click();
    }

    @And("Click Mobile folder")

    public void clickMobileFolder() throws InterruptedException {
        Thread.sleep(3000);
        containerSanityPage.retryingFindClick(folderPage.Mobile);

    }

    @And("Click Sanity: Mobile App 01(preview)")
    public void ClickSanityMobileApp01preview() throws InterruptedException {
        containerSanityPage.waitForVisibility(appsPage.SanityMobileApp01preview);
        appsPage.SanityMobileApp01preview.click();

    }

    @And("Select {string} radio button for app mode")
    public void selectRadioButtonForAppMode(String appMode) {
        containerSanityPage.waitForVisibility(containerSanityPage.test_appMode);
        if(appMode.contains("Test")){
            containerSanityPage.test_appMode.click();
        }else if (appMode.equals("Live")){
            containerSanityPage.live_appMode.click();
        }
    }

    @And("Click OpenApp button")
    public void clickOpenAppButton() {
        containerSanityPage.waitForVisibility(containerSanityPage.openAppButton);
        containerSanityPage.openAppButton.click();
    }

    @And("Validate to display SanityApp1Loaded text on the page")
    public void ValidatetodisplaySanityApp1Loadedtextonthepage () throws InterruptedException {
        Thread.sleep(3000);
        System.out.println("containerSanityPage.SanityApp1Loaded is diplayed = " + containerSanityPage.SanityApp1Loaded);
        Assert.assertTrue(containerSanityPage.SanityApp1Loaded.isDisplayed());
    }

    @And("Validate to display PreviewModeOnly text on the page")
    public void ValidatetodisplayPreviewModeOnlytextonthepage () throws InterruptedException {
        Thread.sleep(3000);
        System.out.println("containerSanityPage.PreviewModeOnly is displayed = " + containerSanityPage.PreviewModeOnly);
        Assert.assertTrue(containerSanityPage.PreviewModeOnly.isDisplayed());
    }


    @And("Click Sanity: Mobile App {int}Test")
    public void clickSanityMobileAppTest(int arg0) {
        containerSanityPage.waitForVisibility(appsPage.SanityMobileApp02preview);
        appsPage.SanityMobileApp02preview.click();
    }

    @And("Validate to display TestModeOnly text on the page")
    public void validateToDisplayTestModeOnlyTextOnThePage() throws InterruptedException {
        Thread.sleep(3000);
        System.out.println("containerSanityPage.TestModeOnly is displayed = " + containerSanityPage.TestModeOnly);
        Assert.assertTrue(containerSanityPage.TestModeOnly.isDisplayed());
    }

    @Then("Validate to display SanityApp{int}Loaded text on the page")
    public void validateToDisplaySanityAppLoadedTextOnThePage(int arg0) throws InterruptedException {
        Thread.sleep(3000);
        System.out.println("containerSanityPage.SanityApp1Loaded is diplayed = " + containerSanityPage.SanityApp2Loaded);
        Assert.assertTrue(containerSanityPage.SanityApp2Loaded.isDisplayed());

    }
}
