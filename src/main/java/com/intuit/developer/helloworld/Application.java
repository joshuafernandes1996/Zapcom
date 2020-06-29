package com.intuit.developer.helloworld;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
import org.springframework.data.rest.webmvc.config.RepositoryRestMvcConfiguration;

/**
 * @author dderose
 *
 */
@SpringBootApplication
public class Application extends SpringBootServletInitializer {

    /**
     * @param args
     */
    public static void main(String[] args) {
    	SpringApplication.run(Application.class, args);
    }

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(Application.class);
    }
}
