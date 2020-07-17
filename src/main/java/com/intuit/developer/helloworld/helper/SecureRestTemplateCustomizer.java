//package com.intuit.developer.helloworld.helper;
//
//import com.intuit.developer.helloworld.controller.QBOController;
//import org.apache.http.client.HttpClient;
//import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
//import org.apache.http.impl.client.HttpClientBuilder;
//import org.apache.http.ssl.SSLContextBuilder;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.context.properties.ConfigurationProperties;
//import lombok.Data;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.boot.context.properties.EnableConfigurationProperties;
//import org.springframework.boot.web.client.RestTemplateCustomizer;
//import org.springframework.http.client.ClientHttpRequestFactory;
//import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
//import org.springframework.stereotype.Component;
//import org.springframework.web.client.RestTemplate;
//
//import javax.net.ssl.SSLContext;
//import java.net.URL;
//import java.util.Arrays;
//
//@ConfigurationProperties("zapcom-timesheets")
//@Data
//class SecureRestTemplateProperties {
//
//    /**
//     * URL location, typically with file:// scheme, of a CA trust store file in JKS format.
//     */
//    String trustStore;
//
//    /**
//     * The store password of the given trust store.
//     */
//    char[] trustStorePassword;
//
//    /**
//     * One of the SSLContext algorithms listed at
//     * https://docs.oracle.com/javase/8/docs/technotes/guides/security/StandardNames.html#SSLContext .
//     */
//    String protocol = "TLSv1.2";
//}
//
//@Component
//@EnableConfigurationProperties(SecureRestTemplateProperties.class)
//@Slf4j
//public class SecureRestTemplateCustomizer implements RestTemplateCustomizer {
//    private final SecureRestTemplateProperties properties;
//
//    @Autowired
//    public SecureRestTemplateCustomizer(
//            SecureRestTemplateProperties properties
//    ) {
//        this.properties = properties;
//    }
//
//
//    @Override
//    public void customize(RestTemplate restTemplate) {
//        final SSLContext sslContext;
//        final SSLConnectionSocketFactory socketFactory;
//        try {
//            sslContext = SSLContextBuilder.create()
//                    .loadTrustMaterial(new URL(properties.trustStore),
//                            properties.trustStorePassword)
//                    .useProtocol(properties.protocol)
//                    .build();
//            socketFactory = new SSLConnectionSocketFactory(sslContext);
//        } catch (Exception e) {
//            throw new IllegalStateException(
//                    "Failed to setup client SSL context", e
//            );
//        } finally {
//            // it's good security practice to zero out passwords,
//            // which is why they're char[]
//            Arrays.fill(properties.trustStorePassword, (char) 0);
//        }
//        final HttpClient httpClient = HttpClientBuilder.create()
//                .setSSLSocketFactory(socketFactory)
//                .build();
//        final HttpComponentsClientHttpRequestFactory requestFactory =
//                new HttpComponentsClientHttpRequestFactory(httpClient);
//
////        log.info("Registered SSL truststore {} for client requests"+
////                properties.trustStore);
//
//        restTemplate.setRequestFactory(requestFactory);
//    }
//}
