package com.intuit.developer.helloworld.controller;

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.ArrayList;
import java.util.List;
import java.util.Timer;
import java.util.concurrent.TimeUnit;

import javax.servlet.http.HttpSession;

import com.intuit.oauth2.client.OAuth2PlatformClient;
import com.intuit.oauth2.data.PlatformResponse;
import com.intuit.oauth2.exception.ConnectionException;
import org.apache.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.View;
import org.springframework.web.servlet.view.RedirectView;
import com.intuit.developer.helloworld.client.OAuth2PlatformClientFactory;
import com.intuit.oauth2.config.OAuth2Config;
import com.intuit.oauth2.config.Scope;
import com.intuit.oauth2.exception.InvalidRequestException;

/**
 * @author dderose
 */
@Controller
public class HomeController {

    private static final Logger logger = Logger.getLogger(HomeController.class);

    @Autowired
    OAuth2PlatformClientFactory factory;

    @RequestMapping("/")
    public String home(HttpSession session) {
        if (session.getAttribute("access_token") == null)
            return "home";
        else
            return "dashboard";
    }

    @RequestMapping("/logout")
    public String logout(HttpSession session) throws ConnectionException, InterruptedException {
        if (session.getAttribute("access_token") == null){
            return "home";}
        else {
            OAuth2PlatformClient client = factory.getOAuth2PlatformClient();
            String refreshToken = (String) session.getAttribute("refresh_token");

            //Call revoke endpoint
            PlatformResponse response = client.revokeToken(refreshToken); //set refresh token
            System.out.println("---------------------------");
            System.out.println(refreshToken);
            System.out.println(response.getErrorMessage());
            session.invalidate();
            TimeUnit.SECONDS.sleep(2);
            return "home";
        }
    }

    @RequestMapping("/connected")
    public String connected(HttpSession session) {
        if (session.getAttribute("access_token") == null)
            return "home";
        else
            return "connected";
    }

    @RequestMapping("/dashboard")
    public String dashboard(HttpSession session) {
        if (session.getAttribute("access_token") == null)
            return "home";
        else
            return "dashboard";
    }

    /**
     * Controller mapping for connectToQuickbooks button
     *
     * @return
     */
    @RequestMapping("/connectToQuickbooks")
    public View connectToQuickbooks(HttpSession session) {
        logger.info("inside connectToQuickbooks ");
        OAuth2Config oauth2Config = factory.getOAuth2Config();

        String redirectUri = factory.getPropertyValue("OAuth2AppRedirectUri");

        String csrf = oauth2Config.generateCSRFToken();
        session.setAttribute("csrfToken", csrf);
        try {
            List<Scope> scopes = new ArrayList<Scope>();
            scopes.add(Scope.Accounting);
            return new RedirectView(oauth2Config.prepareUrl(scopes, redirectUri, csrf), true, true, false);
        } catch (InvalidRequestException e) {
            logger.error("Exception calling connectToQuickbooks ", e);
        }
        return null;
    }

}
