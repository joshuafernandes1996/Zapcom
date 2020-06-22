package com.intuit.developer.helloworld.controller;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpSession;

import com.intuit.developer.helloworld.model.TimeActivityRequestBody;
import com.intuit.ipp.data.*;
import com.intuit.ipp.data.Error;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intuit.developer.helloworld.client.OAuth2PlatformClientFactory;
import com.intuit.developer.helloworld.helper.QBOServiceHelper;
import com.intuit.ipp.exception.FMSException;
import com.intuit.ipp.exception.InvalidTokenException;
import com.intuit.ipp.services.DataService;
import com.intuit.ipp.services.QueryResult;
import com.intuit.oauth2.client.OAuth2PlatformClient;
import com.intuit.oauth2.data.BearerTokenResponse;
import com.intuit.oauth2.exception.OAuthException;

import static org.springframework.http.MediaType.APPLICATION_JSON_VALUE;

/**
 * @author dderose
 *
 */
@Controller
public class QBOController {
	
	@Autowired
	OAuth2PlatformClientFactory factory;
	
	@Autowired
    public QBOServiceHelper helper;

	
	private static final Logger logger = Logger.getLogger(QBOController.class);
	private static final String failureMsg="Failed";
	
	
	/**
     * Sample QBO API call using OAuth2 tokens
     * 
     * @param session
     * @return
     */
	@ResponseBody
    @RequestMapping("/getCompanyInfo")
    public String callQBOCompanyInfo(HttpSession session) {

    	String realmId = (String)session.getAttribute("realmId");
    	if (StringUtils.isEmpty(realmId)) {
    		return new JSONObject().put("response","No realm ID.  QBO calls only work if the accounting scope was passed!").toString();
    	}
    	String accessToken = (String)session.getAttribute("access_token");
    	
        try {
        	
        	
        	//get DataService
    		DataService service = helper.getDataService(realmId, accessToken);
			
			// get all companyinfo
			String sql = "select * from companyinfo";
			QueryResult queryResult = service.executeQuery(sql);
			return processResponse(failureMsg, queryResult);
			
		}
	        /*
	         * Handle 401 status code - 
	         * If a 401 response is received, refresh tokens should be used to get a new access token,
	         * and the API call should be tried again.
	         */
	        catch (InvalidTokenException e) {			
				logger.error("Error while calling executeQuery :: " + e.getMessage());
				
				//refresh tokens
	        	logger.info("received 401 during companyinfo call, refreshing tokens now");
	        	OAuth2PlatformClient client  = factory.getOAuth2PlatformClient();
	        	String refreshToken = (String)session.getAttribute("refresh_token");
	        	
				try {
					BearerTokenResponse bearerTokenResponse = client.refreshToken(refreshToken);
					session.setAttribute("access_token", bearerTokenResponse.getAccessToken());
		            session.setAttribute("refresh_token", bearerTokenResponse.getRefreshToken());
		            
		            //call company info again using new tokens
		            logger.info("calling companyinfo using new tokens");
		            DataService service = helper.getDataService(realmId, accessToken);
					
					// get all companyinfo
					String sql = "select * from companyinfo";
					QueryResult queryResult = service.executeQuery(sql);
					return processResponse(failureMsg, queryResult);
					
				} catch (OAuthException e1) {
					logger.error("Error while calling bearer token :: " + e.getMessage());
					return new JSONObject().put("response",failureMsg).toString();
				} catch (FMSException e1) {
					logger.error("Error while calling company currency :: " + e.getMessage());
					return new JSONObject().put("response",failureMsg).toString();
				}
	            
			} catch (FMSException e) {
				List<Error> list = e.getErrorList();
				list.forEach(error -> logger.error("Error while calling executeQuery :: " + error.getMessage()));
				return new JSONObject().put("response",failureMsg).toString();
			}
		
    }

	/**
	 * Sample QBO API call using OAuth2 tokens
	 *
	 * @param session
	 * @return
	 */
	@ResponseBody
	@RequestMapping("/getInvoice")
	public String callQBOInvoice(HttpSession session) {

		String realmId = (String)session.getAttribute("realmId");
		if (StringUtils.isEmpty(realmId)) {
			return new JSONObject().put("response","No realm ID.  QBO calls only work if the accounting scope was passed!").toString();
		}
		String accessToken = (String)session.getAttribute("access_token");

		try {


			//get DataService
			DataService service = helper.getDataService(realmId, accessToken);

			// get all companyinfo
			String sql = "select * from Invoice where id = '1'";
			QueryResult queryResult = service.executeQuery(sql);
			return processResponse(failureMsg, queryResult);

		}
		/*
		 * Handle 401 status code -
		 * If a 401 response is received, refresh tokens should be used to get a new access token,
		 * and the API call should be tried again.
		 */
		catch (InvalidTokenException e) {
			logger.error("Error while calling executeQuery :: " + e.getMessage());

			//refresh tokens
			logger.info("received 401 during companyinfo call, refreshing tokens now");
			OAuth2PlatformClient client  = factory.getOAuth2PlatformClient();
			String refreshToken = (String)session.getAttribute("refresh_token");

			try {
				BearerTokenResponse bearerTokenResponse = client.refreshToken(refreshToken);
				session.setAttribute("access_token", bearerTokenResponse.getAccessToken());
				session.setAttribute("refresh_token", bearerTokenResponse.getRefreshToken());

				//call company info again using new tokens
				logger.info("calling invoice using new tokens");
				DataService service = helper.getDataService(realmId, accessToken);

				// get all companyinfo
				String sql = "select * from Invoice where id = '1'";
				QueryResult queryResult = service.executeQuery(sql);
				return processResponse(failureMsg, queryResult);

			} catch (OAuthException e1) {
				logger.error("Error while calling bearer token :: " + e.getMessage());
				return new JSONObject().put("response",failureMsg).toString();
			} catch (FMSException e1) {
				logger.error("Error while calling company currency :: " + e.getMessage());
				return new JSONObject().put("response",failureMsg).toString();
			}

		} catch (FMSException e) {
			List<Error> list = e.getErrorList();
			list.forEach(error -> logger.error("Error while calling executeQuery :: " + error.getMessage()));
			return new JSONObject().put("response",failureMsg).toString();
		}

	}


	/**
	 * Sample QBO API call using OAuth2 tokens
	 *
	 * @param session
	 * @return
	 */
	@ResponseBody
	@RequestMapping("/getEmployeeInfo")
	public String callQBOEmployeeInfo(HttpSession session, @RequestParam String eachEmp) {
		eachEmp = eachEmp.replace("'", "\\'" );
		String realmId = (String)session.getAttribute("realmId");
		if (StringUtils.isEmpty(realmId)) {
			return new JSONObject().put("response","No realm ID.  QBO calls only work if the accounting scope was passed!").toString();
		}
		String accessToken = (String)session.getAttribute("access_token");

		try {

			//get DataService
			DataService service = helper.getDataService(realmId, accessToken);

			// get all employeeinfo
			String sql = "select * from employee where DisplayName ='" + eachEmp + "'";
			QueryResult queryResult = service.executeQuery(sql);
			return empProcessResponse(failureMsg, queryResult);

		}
		/*
		 * Handle 401 status code -
		 * If a 401 response is received, refresh tokens should be used to get a new access token,
		 * and the API call should be tried again.
		 */
		catch (InvalidTokenException e) {
			logger.error("Error while calling executeQuery :: " + e.getMessage());

			//refresh tokens
			logger.info("received 401 during employeeinfo call, refreshing tokens now");
			OAuth2PlatformClient client  = factory.getOAuth2PlatformClient();
			String refreshToken = (String)session.getAttribute("refresh_token");

			try {
				BearerTokenResponse bearerTokenResponse = client.refreshToken(refreshToken);
				session.setAttribute("access_token", bearerTokenResponse.getAccessToken());
				session.setAttribute("refresh_token", bearerTokenResponse.getRefreshToken());

				//call company info again using new tokens
				logger.info("calling employeeinfo using new tokens");
				DataService service = helper.getDataService(realmId, accessToken);

				// get all employeeinfo
				String sql = "select * from employee where DisplayName =" + eachEmp;
				QueryResult queryResult = service.executeQuery(sql);
				return empProcessResponse(failureMsg, queryResult);

			} catch (OAuthException e1) {
				logger.error("Error while calling bearer token :: " + e.getMessage());
				return new JSONObject().put("response",failureMsg).toString();
			} catch (FMSException e1) {
				logger.error("Error while calling company currency :: " + e.getMessage());
				return new JSONObject().put("response",failureMsg).toString();
			}

		} catch (FMSException e) {
			List<Error> list = e.getErrorList();
			list.forEach(error -> logger.error("Error while calling executeQuery :: " + error.getMessage()));
			return new JSONObject().put("response",failureMsg).toString();
		}

	}

	/**
	 * Sample QBO API call using OAuth2 tokens
	 *
	 * @param session
	 * @return
	 */
	@ResponseBody
	@RequestMapping("/getCustomersInfo")
	public String callQBOCustomerInfo(HttpSession session, @RequestParam String eachCus) {
		eachCus = eachCus.replace("'", "\\'" );
		String realmId = (String)session.getAttribute("realmId");
		if (StringUtils.isEmpty(realmId)) {
			return new JSONObject().put("response","No realm ID.  QBO calls only work if the accounting scope was passed!").toString();
		}
		String accessToken = (String)session.getAttribute("access_token");

		try {

			//get DataService
			DataService service = helper.getDataService(realmId, accessToken);

			// get all customerinfo
			String sql = "Select * from Customer where DisplayName ='" + eachCus + "'";
			QueryResult queryResult = service.executeQuery(sql);
			return custProcessResponse(failureMsg, queryResult);

		}
		/*
		 * Handle 401 status code -
		 * If a 401 response is received, refresh tokens should be used to get a new access token,
		 * and the API call should be tried again.
		 */
		catch (InvalidTokenException e) {
			logger.error("Error while calling executeQuery :: " + e.getMessage());

			//refresh tokens
			logger.info("received 401 during customerinfo call, refreshing tokens now");
			OAuth2PlatformClient client  = factory.getOAuth2PlatformClient();
			String refreshToken = (String)session.getAttribute("refresh_token");

			try {
				BearerTokenResponse bearerTokenResponse = client.refreshToken(refreshToken);
				session.setAttribute("access_token", bearerTokenResponse.getAccessToken());
				session.setAttribute("refresh_token", bearerTokenResponse.getRefreshToken());

				//call customer info again using new tokens
				logger.info("calling customerinfo using new tokens");
				DataService service = helper.getDataService(realmId, accessToken);

				// get all customerinfo
				String sql = "Select * from Customer where DisplayName ='" + eachCus + "'";
				QueryResult queryResult = service.executeQuery(sql);
				return empProcessResponse(failureMsg, queryResult);

			} catch (OAuthException e1) {
				logger.error("Error while calling bearer token :: " + e.getMessage());
				return new JSONObject().put("response",failureMsg).toString();
			} catch (FMSException e1) {
				logger.error("Error while calling company currency :: " + e.getMessage());
				return new JSONObject().put("response",failureMsg).toString();
			}

		} catch (FMSException e) {
			List<Error> list = e.getErrorList();
			list.forEach(error -> logger.error("Error while calling executeQuery :: " + error.getMessage()));
			return new JSONObject().put("response",failureMsg).toString();
		}

	}

	@ResponseBody
	@RequestMapping(value = "/deleteTimeActivity/{Id}/{SyncToken}", method = RequestMethod.GET)
	public String deleteTimeActivity(HttpSession session, @PathVariable String Id, @PathVariable String SyncToken) {
		TimeActivity timeActivity = new TimeActivity();
		System.out.println("SyncToken: "+ SyncToken);
		String realmId = (String)session.getAttribute("realmId");
		if (StringUtils.isEmpty(realmId)) {
			return new JSONObject().put("response","No realm ID.  QBO calls only work if the accounting scope was passed!").toString();
		}

		timeActivity.setId(Id);
		timeActivity.setSyncToken(SyncToken);
		String accessToken = (String)session.getAttribute("access_token");
		try {

			//get DataService
			DataService service = helper.getDataService(realmId, accessToken);

			//Delete effort
			TimeActivity deletedActivity = service.delete(timeActivity);

			//return response back
			return createResponse(deletedActivity);

		}
		/*
		 * Handle 401 status code -
		 * If a 401 response is received, refresh tokens should be used to get a new access token,
		 * and the API call should be tried again.
		 */
		catch (InvalidTokenException e) {
			logger.error("Error while calling executeQuery :: " + e.getMessage());

			//refresh tokens
			logger.info("received 401 during timeactivity call, refreshing tokens now");
			OAuth2PlatformClient client  = factory.getOAuth2PlatformClient();
			String refreshToken = (String)session.getAttribute("refresh_token");

			try {
				BearerTokenResponse bearerTokenResponse = client.refreshToken(refreshToken);
				session.setAttribute("access_token", bearerTokenResponse.getAccessToken());
				session.setAttribute("refresh_token", bearerTokenResponse.getRefreshToken());

				//call customer info again using new tokens
				logger.info("calling timeactivity using new tokens");
				DataService service = helper.getDataService(realmId, accessToken);

				//Delete effort
				TimeActivity deletedActivity = service.delete(timeActivity);

				//return response back
				return createResponse(deletedActivity);

			} catch (OAuthException e1) {
				logger.error("Error while calling bearer token :: " + e.getMessage());
				return new JSONObject().put("response",failureMsg).toString();
			} catch (FMSException e1) {
				logger.error("Error while calling company currency :: " + e.getMessage());
				return new JSONObject().put("response",failureMsg).toString();
			}

		} catch (FMSException e) {
			List<Error> list = e.getErrorList();
			list.forEach(error -> logger.error("Error while calling executeQuery :: " + error.getMessage()));
			return new JSONObject().put("response",failureMsg).toString();
		}
	}

	@ResponseBody
	@RequestMapping(value = "/getTimeActivityByDate", method = RequestMethod.GET)
	public String findTimeActivityByTxnDate(HttpSession session, @RequestParam String TxnDate) {
		System.out.println("TxnDate: "+ TxnDate);
		String realmId = (String)session.getAttribute("realmId");
		if (StringUtils.isEmpty(realmId)) {
			return new JSONObject().put("response","No realm ID.  QBO calls only work if the accounting scope was passed!").toString();
		}
		String accessToken = (String)session.getAttribute("access_token");
		try {

			//get DataService
			DataService service = helper.getDataService(realmId, accessToken);

			// get timeactivity by TxnDate
			String sql = "select * from timeactivity where TxnDate ='" + TxnDate + "'";
			QueryResult queryResult = service.executeQuery(sql);
			return timeActProcessResponse(failureMsg, queryResult);

		}
		/*
		 * Handle 401 status code -
		 * If a 401 response is received, refresh tokens should be used to get a new access token,
		 * and the API call should be tried again.
		 */
		catch (InvalidTokenException e) {
			logger.error("Error while calling executeQuery :: " + e.getMessage());

			//refresh tokens
			logger.info("received 401 during timeactivity call, refreshing tokens now");
			OAuth2PlatformClient client  = factory.getOAuth2PlatformClient();
			String refreshToken = (String)session.getAttribute("refresh_token");

			try {
				BearerTokenResponse bearerTokenResponse = client.refreshToken(refreshToken);
				session.setAttribute("access_token", bearerTokenResponse.getAccessToken());
				session.setAttribute("refresh_token", bearerTokenResponse.getRefreshToken());

				//call customer info again using new tokens
				logger.info("calling timeactivity using new tokens");
				DataService service = helper.getDataService(realmId, accessToken);

				// get all customerinfo
				String sql = "select * from timeactivity where TxnDate ='" + TxnDate + "'";
				QueryResult queryResult = service.executeQuery(sql);
				return timeActProcessResponse(failureMsg, queryResult);

			} catch (OAuthException e1) {
				logger.error("Error while calling bearer token :: " + e.getMessage());
				return new JSONObject().put("response",failureMsg).toString();
			} catch (FMSException e1) {
				logger.error("Error while calling company currency :: " + e.getMessage());
				return new JSONObject().put("response",failureMsg).toString();
			}

		} catch (FMSException e) {
			List<Error> list = e.getErrorList();
			list.forEach(error -> logger.error("Error while calling executeQuery :: " + error.getMessage()));
			return new JSONObject().put("response",failureMsg).toString();
		}
	}

	/**
	 * Sample QBO API call using OAuth2 tokens
	 *
	 * @param session
	 * @param timeActivityData
	 * @return
	 */
	@ResponseBody
	@RequestMapping(value = "/commitEffort", method = RequestMethod.POST, produces = "application/json")
	public String commitEffortForEmployee(HttpSession session, @RequestBody TimeActivityRequestBody timeActivityData) {
		System.out.println("Request body "+createResponse(timeActivityData));
		TimeActivity timeActivity = new TimeActivity();
		if (timeActivityData.getBillableStatus().equalsIgnoreCase("BILLABLE")) {
			timeActivity.setBillableStatus(BillableStatusEnum.BILLABLE);
		} else {
			timeActivity.setBillableStatus(BillableStatusEnum.NOT_BILLABLE);
		}

		ReferenceType r = new ReferenceType();
		r.setValue(timeActivityData.getCustomerRefVal());
		timeActivity.setCustomerRef(r);
		ReferenceType r1 = new ReferenceType();
		r1.setValue(timeActivityData.getEmployeeRefVal());
		timeActivity.setEmployeeRef(r1);
		logger.info("Hourly Rate: "+ timeActivityData.getHourlyRate());
		BigDecimal b = new BigDecimal(timeActivityData.getHourlyRate());
		timeActivity.setHourlyRate(b);
		Integer i = Integer.valueOf(timeActivityData.getHours());
		timeActivity.setHours(i);
		timeActivity.setTxnDate(new Date(timeActivityData.getTxnDate()));
		timeActivity.setNameOf(TimeActivityTypeEnum.EMPLOYEE);
		timeActivity.setDescription(timeActivityData.getDescription());

		System.out.println(timeActivity);

		String realmId = (String)session.getAttribute("realmId");
		if (StringUtils.isEmpty(realmId)) {
			return new JSONObject().put("response","No realm ID.  QBO calls only work if the accounting scope was passed!").toString();
		}
		String accessToken = (String)session.getAttribute("access_token");

		try {

			//get DataService
			DataService service = helper.getDataService(realmId, accessToken);

			//Commit efforts
			TimeActivity savedActivity = service.add(timeActivity);

			//return response back
			return createResponse(savedActivity);

		}
		/*
		 * Handle 401 status code -
		 * If a 401 response is received, refresh tokens should be used to get a new access token,
		 * and the API call should be tried again.
		 */
		catch (InvalidTokenException e) {
			return new JSONObject().put("response","InvalidToken - Refreshtoken and try again").toString();

		} catch (FMSException e) {
			List<Error> list = e.getErrorList();
			list.forEach(error -> logger.error("Error while calling the API :: " + error.getMessage()));
			return new JSONObject().put("response", "Failed").toString();
		}

	}

	/**
	 * Map object to json string
	 * @param entity
	 * @return
	 */
	private String createResponse(Object entity) {
		ObjectMapper mapper = new ObjectMapper();
		String jsonInString;
		try {
			jsonInString = mapper.writeValueAsString(entity);
		} catch (JsonProcessingException e) {
			return createErrorResponse(e);
		} catch (Exception e) {
			return createErrorResponse(e);
		}
		return jsonInString;
	}

	private String createErrorResponse(Exception e) {
		logger.error("Exception while calling QBO ", e);
		return new JSONObject().put("response","Failed").toString();
	}

	private String custProcessResponse(String failureMsg, QueryResult queryResult) {
		if (!queryResult.getEntities().isEmpty() && queryResult.getEntities().size() > 0) {
			Customer customerInfo = (Customer) queryResult.getEntities().get(0);
			ObjectMapper mapper = new ObjectMapper();
			try {
				String jsonInString = mapper.writeValueAsString(customerInfo);
				return jsonInString;
			} catch (JsonProcessingException e) {
				logger.error("Exception while getting company info ", e);
				return new JSONObject().put("response",failureMsg).toString();
			}

		}
		return failureMsg;
	}

	private String empProcessResponse(String failureMsg, QueryResult queryResult) {
		if (!queryResult.getEntities().isEmpty() && queryResult.getEntities().size() > 0) {
			Employee employeeInfo = (Employee) queryResult.getEntities().get(0);
			ObjectMapper mapper = new ObjectMapper();
			try {
				String jsonInString = mapper.writeValueAsString(employeeInfo);
				return jsonInString;
			} catch (JsonProcessingException e) {
				logger.error("Exception while getting company info ", e);
				return new JSONObject().put("response",failureMsg).toString();
			}

		}
		return failureMsg;
	}

	private String processResponse(String failureMsg, QueryResult queryResult) {
		if (!queryResult.getEntities().isEmpty() && queryResult.getEntities().size() > 0) {
			CompanyInfo companyInfo = (CompanyInfo) queryResult.getEntities().get(0);
			logger.info("Companyinfo -> CompanyName: " + companyInfo.getCompanyName());
			ObjectMapper mapper = new ObjectMapper();
			try {
				String jsonInString = mapper.writeValueAsString(companyInfo);
				return jsonInString;
			} catch (JsonProcessingException e) {
				logger.error("Exception while getting company info ", e);
				return new JSONObject().put("response",failureMsg).toString();
			}
			
		}
		return failureMsg;
	}

	private String timeActProcessResponse(String failureMsg, QueryResult queryResult) {
		if (!queryResult.getEntities().isEmpty() && queryResult.getEntities().size() > 0) {
			//CompanyInfo companyInfo = (CompanyInfo) queryResult.getEntities().get(0);
			//logger.info("Companyinfo -> CompanyName: " + companyInfo.getCompanyName());
			List<TimeActivity> timeActivity = (List<TimeActivity>) queryResult.getEntities();
			logger.info("TimeActivity -> TimeActivity: " + timeActivity);
			ObjectMapper mapper = new ObjectMapper();
			try {
				String jsonInString = mapper.writeValueAsString(timeActivity);
				return jsonInString;
			} catch (JsonProcessingException e) {
				logger.error("Exception while getting timesheet info ", e);
				return new JSONObject().put("response",failureMsg).toString();
			}

		}
		return failureMsg;
	}

    
}
