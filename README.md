# Zapcom TS Upload - Java

The [Intuit Developer team](https://developer.intuit.com) has written this starter app in Java using OAuth2.0 to provide working examples of OAuth 2.0 concepts, and how to integrate with Intuit endpoints. 

## Table of Contents

* [Requirements](#requirements)
* [Environment Variables](#environment-variables)
* [Production Server](#production-server)
* [First Use Instructions](#first-use-instructions)
* [Running the code](#running-the-code)
* [Configuring the callback endpoint](#configuring-the-callback-endpoint)
* [Getting the OAuth Tokens](#getting-the-oauth-tokens)
* [Scope](#scope)
* [Storing the Tokens](#storing-the-tokens)


## Requirements

In order to successfully run this sample app you need a few things:

1. Java 1.11
2. A [developer.intuit.com](http://developer.intuit.com) account
3. An app on [developer.intuit.com](http://developer.intuit.com) and the associated client id and client secret.

## Production Server

1. Production server hosted on AWS ec2 instance
3. Ubuntu 20.04 LTS
4. `ssh -i "zap2qb.pem" ubuntu@3.18.177.179` to access the server
5. AWS Load balancer configured to use AWS certificate for HTTPS
6. Production app running on [Zapcom Timesheets](https://timesheet.zapcg.com/)

## Environment Variables

### Development :

*Set system environment variables*

| Key | Description |
|---|---|
``` ZAP_QUICK_OAUTH_CLIENT_ID_DEV ```| Quickbooks sandbox app Client ID
``` ZAP_QUICK_OAUTH_CLIENT_SECRET_DEV ```| Quickbooks sandbox app Client secret
``` ZAP_QUICK_OAUTH_REDIRECT_URL_DEV ```| Sandbox app redirect uri
``` ZAP_QUICK_SERVER_PORT_HTTP ```| App http port

### Production :

*env file name : ~Zap2QB/__zap2qbEnv__*

| Key | Description |
|---|---|
``` ZAP_QUICK_OAUTH_CLIENT_ID ```| Quickbooks production app Client ID
``` ZAP_QUICK_OAUTH_CLIENT_SECRET ```| Quickbooks production app Client secret
``` ZAP_QUICK_OAUTH_REDIRECT_URL ```| Production app redirect uri
``` ZAP_QUICK_SERVER_PORT_HTTP ```| App http port

## First Use Instructions

1. Clone the GitHub repo to your computer
2. Configure environment variables

## Running the code

Once the sample app code is on your computer, you can do the following steps to run the app:

### Development

1. cd to the project directory</li>
2. Run the command:`./gradlew bootRun` (Mac OS) or `gradlew.bat bootRun` (Windows)</li>
3. Wait until the terminal output displays the "Started Application in xxx seconds" message.
4. Your app should be up now in http://localhost:`{PORT_NUMBER}`/ 
5. The oauth2 callback endpoint in the app is http://localhost:`{PORT_NUMBER}`/oauth2redirect
6. To run the code on a different port, update env variable. Also make sure to update the redirect uri in env and in the Developer portal ("Keys" section).
7. To build an executable JAR run the command:` ./gradlew bootJar`. Find the JAR in /build/libs/__Zap2QB-DEV.jar__

### Production 

1. cd to the project directory, *~/Zapcom*</li>
2. Checkout to Production branch. Pull changes</li>
3. Build an executable JAR run the command:`./gradlew bootJar`. JAR in ~/Zapcom/build/libs/__Zap2QB.jar__
4. Copy JAR to ~/Zap2QB/
5. Run `sudo systemctl restart zap2qb` to restart the service
6. Run `sudo journalctl -f -u zap2qb` to get terminal output 

## Configuring the callback endpoint
You'll have to set a Redirect URI in the Developer Portal ("Keys" section). In a sandbox app, the typical value would be http://localhost:`{PORT_NUMBER}`/oauth2redirect, unless you host this sample app in a different way (if you were testing HTTPS, for example).

Note: Using localhost and http will only work when developing, using the sandbox credentials. Once you use production credentials, you'll need to host your app over https.

## Getting the OAuth Tokens

The sample app supports the following flows:

**Connect To QuickBooks** - this flow requests non-OpenID scopes.  You will be able to make a QuickBooks API sample call (using the OAuth2 token) on the `/connected` landing page. 

**Get CompanyInfor API** - This flow can be triggered from the connected page. It queries the QuickBooks CompanyInfo API and retrieves the response.

## Scope

It is important to ensure that the scopes your are requesting match the scopes allowed on the Developer Portal.  For this sample app to work by default, your app on Developer Portal must support Accounting scopes.  If you'd like to support both Accounting and Payment, simply add the`com.intuit.quickbooks.payment` scope in the `application.properties` file connectToQuickbooks method.

## Storing the tokens
This app stores all the tokens and user information in the session. For production ready app, tokens should be encrypted and stored in a database.