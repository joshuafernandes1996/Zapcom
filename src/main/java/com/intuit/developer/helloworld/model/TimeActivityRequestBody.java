package com.intuit.developer.helloworld.model;

public class TimeActivityRequestBody {
    private String txnDate;
    private String EmployeeRefVal;
    private String CustomerRefVal;
    private String Hours;
    private String Description;
    private String BillableStatus;
    private String HourlyRate;

    public TimeActivityRequestBody() {
        super();
    }

    public String getTxnDate() {
        return txnDate;
    }

    public void setTxnDate(String _txnDate) {
        txnDate = _txnDate;
    }

    public String getEmployeeRefVal() {
        return EmployeeRefVal;
    }

    public void setEmployeeRefVal(String employeeRefVal) {
        EmployeeRefVal = employeeRefVal;
    }

    public String getCustomerRefVal() {
        return CustomerRefVal;
    }

    public void setCustomerRefVal(String customerRefVal) {
        CustomerRefVal = customerRefVal;
    }

    public String getHours() {
        return Hours;
    }

    public void setHours(String hours) {
        Hours = hours;
    }

    public String getDescription() {
        return Description;
    }

    public void setDescription(String description) {
        Description = description;
    }

    public String getBillableStatus() {
        return BillableStatus;
    }

    public void setBillableStatus(String billableStatus) {
        BillableStatus = billableStatus;
    }

    public String getHourlyRate() {
        return HourlyRate;
    }

    public void setHourlyRate(String hourlyRate) {
        HourlyRate = hourlyRate;
    }
}
