# 🔄 Asset Status Change - Request Examples

## 📋 Overview

All asset status change requests will now use **User ID 1** as the `changedBy` value as requested.

## 🚀 **Actual Requests Being Sent**

### **Example 1: Change to "In Repair" with Remarks**
```http
PUT /api/assets/123/status
Content-Type: application/json

{
  "status": "In Repair",
  "remarks": "Sent to vendor for repair due to hardware malfunction",
  "changedBy": 1
}
```

### **Example 2: Change to "Broken" with Remarks**
```http
PUT /api/assets/456/status
Content-Type: application/json

{
  "status": "Broken",
  "remarks": "Screen cracked, device unusable",
  "changedBy": 1
}
```

### **Example 3: Change to "Active" without Remarks**
```http
PUT /api/assets/789/status
Content-Type: application/json

{
  "status": "Active",
  "remarks": null,
  "changedBy": 1
}
```

### **Example 4: Change to "In Stock" with Empty Remarks**
```http
PUT /api/assets/101/status
Content-Type: application/json

{
  "status": "In Stock",
  "remarks": null,
  "changedBy": 1
}
```

### **Example 5: Change to "Ceased" with Detailed Remarks**
```http
PUT /api/assets/202/status
Content-Type: application/json

{
  "status": "Ceased",
  "remarks": "Asset reached end of life, being disposed according to company policy",
  "changedBy": 1
}
```

## 🎯 **What the Backend Will Receive**

Every status change request will have:
- ✅ **status**: One of the valid status values ("In Stock", "Active", "In Repair", "Broken", "Ceased")
- ✅ **remarks**: Either a string with the user's comment or `null` if no remarks provided
- ✅ **changedBy**: Always `1` (as hardcoded per request)

## 📝 **Expected Backend Processing**

For each request, the backend should:

1. **Update the asset**:
   ```sql
   UPDATE assets 
   SET status = 'In Repair', 
       updated_at = NOW() 
   WHERE asset_id = 123;
   ```

2. **Create audit record**:
   ```sql
   INSERT INTO asset_status_history 
   (asset_id, status, changed_by, change_date, remarks) 
   VALUES 
   (123, 'In Repair', 1, NOW(), 'Sent to vendor for repair due to hardware malfunction');
   ```

3. **Apply business rules**:
   - If status = "Broken" or "Ceased": Set `current_user_id = NULL`
   - If status = "Active": Ideally should have a user assigned

4. **Return response**:
   ```json
   {
     "data": {
       "asset": {
         "assetId": 123,
         "name": "Dell Laptop XPS 13",
         "status": "In Repair",
         "currentUserId": null,
         "updatedAt": "2024-01-15T10:30:00Z"
       },
       "statusHistory": [
         {
           "id": 45,
           "assetId": 123,
           "status": "In Repair",
           "changedBy": 1,
           "changeDate": "2024-01-15T10:30:00Z",
           "remarks": "Sent to vendor for repair due to hardware malfunction"
         }
       ],
       "message": "Asset status updated successfully"
     }
   }
   ```

## 🔍 **Frontend Console Output**

When testing, you'll see these logs in the browser console:

```
🔄 Starting status change process: {
  assetId: 123,
  assetName: "Dell Laptop XPS 13",
  currentStatus: "Active",
  newStatus: "In Repair",
  remarks: "Sent to vendor for repair due to hardware malfunction",
  changedBy: 1
}

📤 Sending status change request: {
  url: "/api/assets/123/status",
  method: "PUT",
  payload: {
    status: "In Repair",
    remarks: "Sent to vendor for repair due to hardware malfunction",
    changedBy: 1
  },
  assetId: 123,
  headers: {
    "Content-Type": "application/json"
  }
}

✅ Status update response: [backend response]
🔄 Asset list updated locally: Dell Laptop XPS 13
🔄 Refreshing assets data...
✅ Assets data refreshed successfully
```

## 🚀 **Ready for Testing**

The frontend is now configured to:
- ✅ Always send `changedBy: 1` in every status change request
- ✅ Properly handle all status values and remarks
- ✅ Provide comprehensive logging for debugging
- ✅ Auto-refresh the UI after successful changes

**The backend team can now implement the API endpoints knowing exactly what data format to expect!** 🎯 