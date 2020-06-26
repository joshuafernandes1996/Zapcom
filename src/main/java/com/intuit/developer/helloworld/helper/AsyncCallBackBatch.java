package com.intuit.developer.helloworld.helper;

import com.intuit.ipp.data.Fault;
import com.intuit.ipp.data.Report;
import com.intuit.ipp.data.Error;
import com.intuit.ipp.data.TimeActivity;
import com.intuit.ipp.services.BatchOperation;
import com.intuit.ipp.services.CallbackHandler;
import com.intuit.ipp.services.CallbackMessage;
import com.intuit.ipp.services.QueryResult;

import java.util.List;

public class AsyncCallBackBatch implements CallbackHandler {

    @Override
    public void execute(CallbackMessage callbackMessage) {
        System.out.println("In AsyncCallBackFind callback...");
        BatchOperation batchOperation = callbackMessage.getBatchOperation();
        List<String> bIds = batchOperation.getBIds();
        for(String bId : bIds) {
            if(batchOperation.isFault(bId)) {
                Fault fault = batchOperation.getFault(bId);
                Error error = fault.getError().get(0);
                System.out.println("Fault error :" + error.getCode() + ", " + error.getDetail() + ", " + error.getMessage());
            } else if(batchOperation.isEntity(bId)) {
                System.out.println("Entity : " + ((TimeActivity)batchOperation.getEntity(bId)).getEmployeeRef());
            } else {
                System.out.println("Something wrong!...");
            }
        }
    }
}
