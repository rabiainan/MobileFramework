
Feature: Login scenarios

  @Login
  Scenario: Login with valid user name and password with config values
    When I am in the login screen
    Then I am login succesfully with config values
    And I've seen Sync Complete! pop up screen

  Scenario: Login with valid credentials
    When I enter account as "qa.internal"
    And I enter username as "container.sanity@auto.nutshellapps.co.uk"
    And I enter password as "P455.word12"
    And I login
    Then I've seen Sync Complete! pop up screen

#  Scenario Outline: Login with invalid credentials ddt
#    When I enter account as "<account>"
#    And I enter username as "<username>"
#    And I enter password as "<password>"
#    And I login
#    Then login should fail with an error "<err>"
#    Examples:
#      | account     | username                                 | password    | err                                       |
#      | q.internal  | container.sanity@auto.nutshellapps.co.uk | P455.word12 | Something went wrong                      |
#      | qa.internal | container.sanity@auto.nutshellapps.co.u  | P455.word12 | Something went wrong                      |
#      | qa.internal | container.sanity@auto.nutshellapps.co.uk | P455.word12 | Something went wrong                      |
#      | ""          | container.sanity@auto.nutshellapps.co.uk | P455.word12 | The following fields are missing:Account  |
#      | qa.internal | ""                                       | P455.word12 | The following fields are missing:Username |
#      | qa.internal | container.sanity@auto.nutshellapps.co.uk | ""          | The following fields are missing:Password |


  Scenario Outline: Login with valid user name and password with ddt
    When I enter account as "<account>"
    And I enter username as "<username>"
    And I enter password as "<password>"
    And I login
    Then I've seen Sync Complete! pop up screen
    Examples:
      |account| username | password |
      |qa.internal | container.sanity@auto.nutshellapps.co.uk | P455.word12 |
