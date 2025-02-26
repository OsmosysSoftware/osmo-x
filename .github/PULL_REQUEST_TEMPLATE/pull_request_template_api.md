## API PR Checklist

### Task Link

Osmosys Developers must include the Pinestem task link in the PR.

[OSXT-###](pinestem-task-url)

### Pre-requisites

- [ ] I have gone through the Contributing guidelines for [Submitting a Pull Request (PR)](https://github.com/OsmosysSoftware/osmo-x/blob/main/CONTRIBUTING.md#-submitting-a-pull-request-pr) and ensured that this is not a duplicate PR.
- [ ] I have performed unit testing for the new feature added or updated to ensure the new features added are working as expected.
- [ ] I have added/updated test cases to the [test suite](https://github.com/OsmosysSoftware/osmo-x/blob/main/apps/api/OsmoX.postman_collection.json) as applicable.
- [ ] I have performed preliminary testing using the [test suite](https://github.com/OsmosysSoftware/osmo-x/blob/main/apps/api/OsmoX.postman_collection.json) to ensure that any existing features are not impacted and any new features are working as expected as a whole.
- [ ] I have added/updated the required [api docs](https://github.com/OsmosysSoftware/osmo-x/tree/main/apps/api/docs) as applicable.
- [ ] I have added/updated the `.env.example` file with the required values as applicable.

### PR Details

PR details have been updated as per the given format (see below)

- [ ] PR title adheres to the format specified in guidelines (e.g., `feat: add admin login endpoint`)
- [ ] Description has been added
- [ ] Related changes have been added (optional)
- [ ] Screenshots have been added (optional)
- [ ] Query request and response examples have been added (as applicable, in case added or updated)
- [ ] Documentation changes have been listed (as applicable)
- [ ] Test suite/unit testing output is added (as applicable)
- [ ] Pending actions have been added (optional)
- [ ] Any other additional notes have been added (optional)

### Additional Information

- [ ] Appropriate label(s) have been added (`ready for review` should be added if the PR is ready to be reviewed)
- [ ] Assignee(s) and reviewer(s) have been added (optional)

_Note: Reviewer should ensure that the checklist and description have been populated and followed correctly, and the PR should be merged only after resolving all conversations and verifying that CI checks pass._

---

**Description:**

Add brief description about the changes made in this PR and their purpose. This section can also include mention to any other PRs or issues if needed.

**Related changes:**

- Add short points about the different changes made within the files in this PR.

**Screenshots:**

Add any screenshots as required.

**Query request and response:**

- Add any query request body, cURL statement and response body for the made change or addition.

**Documentation changes:**

- Add a list of changes made to the API documents with brief descriptions.

**Test suite/unit testing output:**

- Add the output of the status of different test cases in the testing suite or unit testing performed.

**Pending actions:**

- Add list of any pending actions that have or would require to be done in this PR.

**Additional notes:**

- Add list of any additional notes you may want to convey in this PR.
