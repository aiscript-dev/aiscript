# Contribution guide
Thank you for your interest in our project!
This document contains all the information you need to contribute to the project.

## Before implementing
When you want to add a feature or fix a bug, first have the design and policy reviewed in an Issue or something similar (if it is not there, please create one). Without this step, there is a high possibility that the PR will not be merged even if you have implemented it.

Also, when you start implementation, please assign yourself to the issue in question (if you cannot do it yourself, please ask another member to assign you).
By indicating that you are going to implement it, you can avoid conflicts.

## Tools
### Vitest
In this project, we have introduced [Vitest](https://vitest.dev) as a testing framework.
Tests are placed in the [`/test` directory](./test).

Testing is done automatically by CI for each commit/each PR.
To run the test in your local environment, run `npm run test`.

### tsd
In this project, we have introduced [tsd](https://github.com/SamVerschueren/tsd) to test the types.
By using tsd, we can ensure that the type is what we intended it to be.
Type tests with tsd are placed in the [`/test-d` directory](./test-d).

Testing is done automatically by CI for each commit/each PR.
To run the test in your local environment, run `npm run test`.

### API Extractor
In this project, we have introduced [API Extractor](https://api-extractor.com/), which is responsible for generating API reports.
The API report is a snapshot of the API, so to speak, and contains the definitions of the various functions and types that the library exposes (exports) to the outside world. When you run the `npm run api` command, the current report will be generated in the [`/etc` directory](./etc).

When there is a change in the API being exported, the content of the report generated will naturally change, so for example, by comparing the report generated in the develop branch with the report generated in the PR branch, you can use it to detect unintended destructive changes or to check the impact of destructive changes.
Also, inside CI, which is executed for each commit and each PR, API reports are generated each time to check if there are any differences with the existing reports. If there are any differences, an error will occur.

When you create a PR, please run the `npm run api` command to generate API reports and commit any differences.
Committing the report will show that the disruptive change was intended, and as mentioned above, the difference between the reports will make it easier to review the scope of the impact.

### Codecov
In this project, we have introduced [Codecov](https://about.codecov.io/) to measure coverage. Coverage is a measure of how much of the code is covered by the tests.

The coverage measurement is done automatically by CI and no special operation is required. The coverage can be viewed from [here](https://codecov.io/gh/syuilo/aiscript).

Also, for each PR, the coverage of that branch is automatically calculated, and the Codecov bot comments a report containing the difference between the coverage of the branch and the coverage of the merged branch. This allows you to see how much coverage is increased/decreased by merging the PRs.

## Tips for Reviewers
You can read a lot about it in the template for creating a PR. (Maybe you can move it to this document?).
Also, be aware of the "review perspective" described below.

## Tips for Reviewers
- Be willing to comment on the good points as well as the things you want fixed.
    - It will motivate you to contribute.

### Review perspective
- security
    - Doesn't merging this PR create a vulnerability?
- Performance
    - Will merging these PRs cause unexpected performance degradation?
    - Is there a more efficient way?
- Test
    - Is the expected behavior ensured by the test?
    - Are there any loose ends or leaks?
    - Are you able to check for abnormal systems?
    