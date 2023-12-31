# Content Watcher

Content Watcher is a service that watches for events on Frequency and produces DSNP content to respective output channels.

## Table of Contents

- [Content Watcher](#content-watcher)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Getting Started](#getting-started)
    - [Clone the Repository](#clone-the-repository)
    - [Run a Full End-to-End Test](#run-a-full-end-to-end-test)

## Prerequisites

Before you begin, ensure you have met the following requirements:

- **Docker:** Content Watcher is designed to run in a Docker environment. Make sure Docker is installed on your system.

## Getting Started

Follow these steps to set up and run Content Watcher:

### Clone the Repository

1. Clone the Content Watcher repository to your local machine:

   ```bash
   git clone https://github.com/amplicalabls/content-watcher-service.git
   ```

### Run a Full End-to-End Test

1. Execute the following `make` command to deploy the entire stack:

   ```bash
   make test-start-services
   ```

   This command will set up the following services:

    - **Frequency:** A local instance of Frequency will be set up with the default instant sealing mode.
    - **Redis:** A local instance of Redis will be initiated and configured for use by content publishing and content watcher services.
    - **Kubo IPFS:** A local instance of IPFS will be initiated and configured for use in content publishing and retrieval.
    - **Content Publishing API:** A local instance of the content publishing API will be utilized to publish content to IPFS and Frequency for content watcher tests.
    - **Content Publishing Worker:** A local instance of the content publishing worker will be employed to publish content to IPFS and Frequency for content watcher tests via dedicated processors.

   The following setup scenarios will be executed during the stack initialization:

   - **Chain Setup Scenario:** A provider with MSA=1 will be created, with some user accounts, along with delegation to the provider. Capacity will be staked to MSA=1 to enable the provider to publish content on behalf of users.
   - **DSNP Schemas:** DSNP schemas will be registered on Frequency.
   - **Publish Some Example Content:** Example content will be published to IPFS and Frequency. Check the progress of content publishing at [Content Publishing BullBoard](http://0.0.0.0:3001/queues).

2. Run the following `make` command to execute the content watcher tests:

   ```bash
    make test-e2e
    ```

3. Alternatively, create a `.env` file, run `nest start api` to start the content watcher as a standalone service, register a webhook with the content watcher using [swagger](http://0.0.0.0:3000/api/docs/swagger#), and try the following scenarios:

   - **Reset Scanner:** This action will reset the scanner to start from the beginning of the chain or whichever block is chosen to start with. Upon successful parsing, a respective announcement will be made to the webhook.
   - **Put a Search Request:** This action will put a search request on the queue. The request requires a start block and end block. Upon successful parsing, a respective announcement will be made to the webhook.
