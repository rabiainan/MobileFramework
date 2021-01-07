
Feature: Container Sanity Mobile
@ContainerSanity
  Scenario:Sanity: Mobile App 01 (Preview)-Test Option
    Given User login succesfully
    When Click syncClose button
    And Click QA REVIEW folder
    And Click Container Sanity folder
    And Click Mobile folder
    And Click Sanity: Mobile App 01preview
    And Select "Test" radio button for app mode
    And Click OpenApp button
    Then Validate to display SanityApp1Loaded text on the page
    And Validate to display PreviewModeOnly text on the page


  Scenario:Sanity: Mobile App 01 (Preview)-Live Option
    Given User login succesfully
    When Click syncClose button
    And Click QA REVIEW folder
    And Click Container Sanity folder
    And Click Mobile folder
    And Click Sanity: Mobile App 01preview
    And Select "Live" radio button for app mode
    And Click OpenApp button
    Then Validate to display SanityApp1Loaded text on the page
    And Validate to display PreviewModeOnly text on the page

  Scenario:Sanity: Mobile App 02 (Test)-Test Option
    Given User login succesfully
    When Click syncClose button
    And Click QA REVIEW folder
    And Click Container Sanity folder
    And Click Mobile folder
    And Click Sanity: Mobile App 02Test
    And Select "Test" radio button for app mode
    And Click OpenApp button
    Then Validate to display SanityApp2Loaded text on the page
    And Validate to display TestModeOnly text on the page

  Scenario:Sanity: Mobile App 02 (Test) -Live Option
    Given User login succesfully
    When Click syncClose button
    And Click QA REVIEW folder
    And Click Container Sanity folder
    And Click Mobile folder
    And Click Sanity: Mobile App 02Test
    And Select "Live" radio button for app mode
    And Click OpenApp button
    Then Validate to display SanityApp2Loaded text on the page
    And Validate to display TestModeOnly text on the page

  Scenario:Sanity: Mobile App 03 (Test)-Test Option
    Given User login succesfully
    When Click syncClose button
    And Click QA REVIEW folder
    And Click Container Sanity folder
    And Click Mobile folder
    And Click Sanity: Mobile App 03Live
    And Select "Test" radio button for app mode
    And Click OpenApp button
    Then Validate to display SanityApp3Loaded text on the page
    And Validate to display LiveModeOnly text on the page

  Scenario:Sanity: Mobile App 03 (Test)-Live Option
    Given User login succesfully
    When Click syncClose button
    And Click QA REVIEW folder
    And Click Container Sanity folder
    And Click Mobile folder
    And Click Sanity: Mobile App 03Live
    And Select "Live" radio button for app mode
    And Click OpenApp button
    Then Validate to display SanityApp3Loaded text on the page
    And Validate to display LiveModeOnly text on the page

  Scenario:Sanity: Mobile App 04 (all modes)-Preview Option
    Given User login succesfully
    When Click syncClose button
    And Click QA REVIEW folder
    And Click Container Sanity folder
    And Click Mobile folder
    And Click Sanity: Mobile App 04TestAllModes
    And Select "Preview" radio button for app mode
    And Click OpenApp button
    Then Validate to display SanityApp3Loaded text on the page
    And Validate to display LiveModeOnly text on the page

  Scenario:Sanity: Mobile App 04 (all modes)-Test Option
    Given User login succesfully
    When Click syncClose button
    And Click QA REVIEW folder
    And Click Container Sanity folder
    And Click Mobile folder
    And Click Sanity: Mobile App 04TestAllModes
    And Select "Test" radio button for app mode
    And Click OpenApp button
    Then Validate to display SanityApp3Loaded text on the page
    And Validate to display LiveModeOnly text on the page

  Scenario:Sanity: Mobile App 04 (all modes)-Live Option
    Given User login succesfully
    When Click syncClose button
    And Click QA REVIEW folder
    And Click Container Sanity folder
    And Click Mobile folder
    And Click Sanity: Mobile App 04TestAllModes
    And Select "Live" radio button for app mode
    And Click OpenApp button
    Then Validate to display SanityApp3Loaded text on the page
    And Validate to display LiveModeOnly text on the page

  Scenario:Sanity: Mobile App 04 (all modes)-Preview Option
    Given User login succesfully
    When Click syncClose button
    And Click QA REVIEW folder
    And Click Container Sanity folder
    And Click Mobile folder
    And Click Sanity: Mobile App 04TestAllModes
    And Select "Preview" radio button for app mode
    And Click OpenApp button
    Then Validate to display SanityApp3Loaded text on the page
    And Validate to display LiveModeOnly text on the page






#  @test
#  Scenario: Login with valid user name and password with config values
#    When I am in the login screen
#    Then I am login succesfully with config values
#    And I've seen Sync Complete! pop up screen
#
#  @test
#  Scenario: To test that I can login to a instance with valid login details
#    When user navigate to config URL
#    Given the login screen is loaded
#    When I login with valid login details
#    Then I am redirected into the instance under that users account"

#  @test
#  Scenario:To test that I can login to a instance with valid login details
#    Given the login screen is loaded
#    When I login with valid login details
#    Then I am redirected into the instance under that users account"
#
#  Scenario: User close the sync pop up screen after cold sync completed
#    When Open the sync pop up screen
#    And User tap to close button
#    Then The home screen is opened
#
#  Scenario: User navigate to the "Mobile" folder
#    Given User is in the home screen
#    When User tap the "QA REVIEW" folder
#    And User tap the "Container Sanity" folder
#    And User tap the "Mobile" folder
#
#  Scenario: User open the "Mobile App 01preview" app
#    When User is in the "Mobile" folder
#    And Select "Test" radio button for app mode
#    And User click the "OpenApp" buton
#    Then The "Mobile App 01preview" app is opened succesfully
#    And Validate to display SanityApp1Loaded text on the page
#    And Validate to display PreviewModeOnly text on the page