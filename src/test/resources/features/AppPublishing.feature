Feature: App Publishing scenarios
  @browser
  Scenario: Navigate to configProperties URL
  Then user navigate to config URL

  Scenario: Open the Apps Directory page
    When I am on the dashboard
    Given I click the Apps button
    Then Qa Review folder is displayed

    
  Scenario: Open the Apps QA REVIEW folder
    When I am on the app directory page
    Given I click the QA REVIEW folder
    Then Container Sanity folder is displayed

  Scenario: Open the Apps Container Sanity folder
    When I am on the QA REVIEW folder
    Given I click the Container Sanity folder
    Then Mobile folder is displayed

  Scenario: Open the Apps Mobile folder
    When I am on the Container Sanity folder
    Given I click the Mobile folder
    Then I am in the Mobile folder

  Scenario: Open the Sanity: Mobile App 01 (preview) app
    When I am in the Mobile folder
    Given I click the Sanity: Mobile AppPreview
    Then I am in the Sanity: Mobile AppPreview

  Scenario: Publishing app
    When I am in the builder
    Given I click the publish button
    Then The workflow dialog popup is opened