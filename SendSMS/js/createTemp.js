
var mobNum;
var str;
var s;
var i = 0;
var j;
var variable = 0;
var resp;
var txt;
var tab;
var templateSelected = 0;
var entity_type = 0;
var entitiy_name = "";
recepients = [];
updates = [];
names = [];
utils={};
$(document).ready(function() {
    ZOHO.embeddedApp.on("PageLoad", function(data) {
        $('#loading').show();
        var count=0;
        var n=0;
        tab = "";
        entitiy_name = data.Entity; 

        ZOHO.CRM.META.getFields({
            "Entity": entitiy_name
        }).then(function(data) {
            var fieldsrc = $("#fieldsList").html(); //get contents of field
            var fieldTemplate = Handlebars.compile(fieldsrc); //convert to template using Handlebars.compile()
            var html = fieldTemplate(data); //getting the html
            $("#fieldnames").html(html); //rendering it
        });
        if (entitiy_name == "Leads") {
            entity_type = 1;
            for (var id in data.EntityId) {
            ZOHO.CRM.API.getRecord({
                    Entity: "Leads",
                    RecordID: data.EntityId[id]
                })
                .then(function(data) {
                    data = data.data[0];
                    n++;
                    names.push(data.Full_Name);
                    recepients.push({
                        "data": data
                    });
                    if(n<=9)
                    {
                        tab='<li class="conlist" id="'+data.id+'"><span style="color:#222;">'+data.Full_Name+'</span><span class="ConText" onclick="deleteRow(this.id,this.parentNode.id)" id="'+count+'"></span></li>';
                        count++;
                        return tab;
                    }
                    else
                    {
                        
                        tab='<li class="hidden" style="display: none;" id="'+data.id+'"><span style="color:#222;">'+data.Full_Name+'</span><span class="ConText" onclick="deleteRow(this.id,this.parentNode.id)" id="'+count+'"></span></li>'
                        count++;
                        return tab;

                    }                   
                }).then(function(tab) {
                    if(id>=9)
                    {
                        tab+="</div>"
                    }
                    document.getElementById("recipientsList").innerHTML += tab;
                })
            }
        }
        else if (entitiy_name == "Contacts") {
            entity_type = 2;
            for (var id in data.EntityId) {
            ZOHO.CRM.API.getRecord({
                    Entity: "Contacts",
                    RecordID: data.EntityId[id]
                })
                .then(function(data) {
                    data = data.data[0];
                    n++;
                    names.push(data.Full_Name);
                    recepients.push({
                        "data": data
                    });
                    if(n<=9)
                    {
                        tab='<li class="conlist" id="'+data.id+'"><span style="color:#222;">'+data.Full_Name+'</span><span class="ConText" onclick="deleteRow(this.id,this.parentNode.id)" id="'+count+'"></span></li>';
                        count++;
                        return tab;
                    }
                    else
                    {                        
                        tab='<li class="hidden" style="display: none;" id="'+data.id+'"><span style="color:#222;">'+data.Full_Name+'</span><span class="ConText" onclick="deleteRow(this.id,this.parentNode.id)" id="'+count+'"></span></li>'
                        count++;
                        return tab;
                    }                   
                }).then(function(tab) {
                    if(id>=9)
                    {
                        tab+="</div>"
                    }
                    document.getElementById("recipientsList").innerHTML += tab;
                })
            }
        }                       
    })

    ZOHO.embeddedApp.init().then(function() {
        var action=1;
        $('a').click(function(){
            if(action==1)
            {
            $(this).text('-View Less')
            $(".hidden").toggle('slow');
            action=2;
        }
        else if(action==2){
            $(this).text('+View More')
            $(".hidden").toggle('slow');
            action=1;
        }
        })        
    }).then(function() {
        ZOHO.CRM.API.getOrgVariable("mmcrm__Twilio_Account_SID").then(function(data) {
            utils.accntSID = data.Success.Content;
            if(data.Success.Content == "")
             {
                 console.log("Twilio is not configured!"); 
                 $("#auth").show(); 
                 $("#main_div").hide(); 

                 setTimeout(function(){ 
                    ZOHO.CRM.UI.Setting.open({"APIName":"mmcrm__smssetting"});
                    ZOHO.CRM.UI.Popup.close(); 
                }, 2000);
                                           
             }else{
                ZOHO.CRM.API.getOrgVariable("mmcrm__Twilio_AuthToken").then(function(data) {
                utils.auth = data.Success.Content;
                str = utils.accntSID + ":" + utils.auth;
                utils.encodedAuth = btoa(str);                
                request = {
                    url: "https://api.twilio.com/2010-04-01/Accounts/"+utils.accntSID+"/IncomingPhoneNumbers.json",
                    headers: {
                        Authorization: "Basic " + utils.encodedAuth,
                    }
                }
                ZOHO.CRM.HTTP.get(request)
                    .then(function(data) {
                        var list = JSON.parse(data);
                        $("#auth").hide(); 
                        $("#main_div").show(); 
                        var newList = list.incoming_phone_numbers;
                        var numbers = $('#fromNum').html();
                        var numbersTemplate = Handlebars.compile(numbers);
                        $("#listNumbers").html(numbersTemplate(newList));
                        for(i=0; i<newList.length; i++)
                       {
                            $("#toNumber").append("<option value="+newList[i].phone_number+">"+newList[i].friendly_name+" : "+newList[i].phone_number+"</option>")
                       }
                       ZOHO.CRM.API.getAllRecords({
                        Entity: "SMS_Templates",
                        sort_order: "desc"
                        })
                        .then(function(data) {
                            data = data.data;
                                s = {
                                    "obj": data
                                };
                               if(data.status==204){
                                document.getElementById("templist").innerHTML=' <select id="temp" class="fldtype1"><option id="none">--None--</option></select>'
                                $('#loading').hide();  
                               }
                               else
                               {
                                var tempSrc = $('#templates').html();
                                var tempTemplate = Handlebars.compile(tempSrc);
                                var temphtml = tempTemplate(s);
                                $("#templist").html(temphtml);
                                $('#loading').hide();
                              }  
                        })
                    });
                })
             }
        })
    })

});
function back()
{
    $('#loading').show();
    $('#create').hide();
    $('#getTemp').show();
    /*
    ZOHO.CRM.API.searchRecord({Entity:"SMS_Templates",Type:"criteria",Query:"((Template_Module:equals:Plain)or(Template_Module:equals:"+entitiy_name+"))"})
    .then(function(respData){
        data = respData.data;
        if (data.status == 204) {
                            $('#listTemplatesDiv').hide();
                        } else {
                                s = {
                                    "obj": data
                                };
                                var tempSrc = $('#templates').html();
                                var tempTemplate = Handlebars.compile(tempSrc);
                                var temphtml = tempTemplate(s);
                                $("#templist").html(temphtml);
                                ZOHO.CRM.API.getRecord({
                                Entity: "SMS_Templates",
                                RecordID: data[0].id
                            })
                            .then(function(data) {
                                document.getElementById("temp").options[1].selected=true;
                                txt = (data["Template_Content"]);
                                document.getElementById("msgTxt").innerHTML = txt;
                                templateSelected = 1;
                                $('#loading').hide();
                            })
                        }
    });
    */
    
    ZOHO.CRM.API.getAllRecords({
                        Entity: "SMS_Templates",
                        sort_order: "desc"
                    })
                    .then(function(data) {
                        if (data.status == 204) {
                            $('#listTemplatesDiv').hide();
                        } else {
                            data = data.data;
                            s = {
                                "obj": data
                            };
                            var tempSrc = $('#templates').html();
                            var tempTemplate = Handlebars.compile(tempSrc);
                            var temphtml = tempTemplate(s);
                            $("#templist").html(temphtml);
                            ZOHO.CRM.API.getRecord({
                                Entity: "SMS_Templates",
                                RecordID: data[0].id
                            })
                            .then(function(data) {
                                data = data.data[0];
                                document.getElementById("temp").options[1].selected=true;
                                txt = (data["Template_Content"]);
                                document.getElementById("msgTxt").innerHTML = txt;
                                templateSelected = 1;
                                $('#loading').hide();
                            })
                        }
                    })
    

}

function deleteRow(i,id) {
    var x=parseInt(i)
    if(recepients.length==1){
        document.getElementsByClassName("viewmore-div")[0].style.borderTopColor="#ff0000";
        $("#recp").show();
    }
    else
    {
for(var k in recepients)
{
    if(recepients[k].data.id==id)
    {
    recepients.splice(k, 1);
    $('#'+id).remove();
}
}
}
}
function addField() {
    document.getElementById("templateTxt").value += "$(" + document.getElementById("selectOption").value + ")";
}

function update() {
   
    template = {};
    template.name = document.getElementById("templateName").value
    template.content = document.getElementById("templateTxt").value
    if(template.name==""){
        document.getElementById("templateName").style.borderBottomColor="#ff0000";
        $("#tempNameEmptyDiv").show();
    }
    else if (template.content=="")
{
   document.getElementById("templateTxt").style.borderColor="#ff0000"; 
   $("#templateEmptyAlert").show();
}

    if(template.name!=""&&template.content!="")
    {   
         $('#loading').show();
        var recordData = {
            "Name": template.name,
            "Template_Content": template.content
        }
         var fieldRegex = /\$\((\w*)\)/g;
        var match = fieldRegex.exec(template.content);
        if (match) {
           // fields.push(match[1]);
           recordData["Template_Module"]=entitiy_name;
        }else{
            recordData["Template_Module"]="Plain";
        }
        ZOHO.CRM.API.insertRecord({
                Entity: "SMS_Templates",
                APIData: recordData
            })
            .then(function(data) {
                $('#loading').hide();
                $('#successMsg').show();
                setTimeout('$("#successMsg").hide()',2000);
                return back();
                 
            });
    }
}

function addTemp() {
    $('#getTemp').hide();
    $('#create').show();
     document.getElementById("templateName").value = "";
                document.getElementById("templateTxt").value = "";
               document.getElementById("selectOption").options[0].selected=true;
               document.getElementById("templateName").style.borderBottomColor="#444";
               $("#tempNameEmptyDiv").hide();
                  document.getElementById("templateTxt").style.borderColor="rgb(206, 206, 206)"; 
$("#templateEmptyAlert").hide();
}

function listTemplates() {
    $('#loading').show();
    var selectedTemplate = document.getElementById("temp").value;
    var ind = document.getElementById("temp").selectedIndex;
    utils.id = document.getElementById("temp").getElementsByTagName("option")[ind].value;
    var b;
    if (selectedTemplate == "--None--") {
        document.getElementById("msgTxt").innerHTML = "";
        return;
    }
    ZOHO.CRM.API.getRecord({
            Entity: "SMS_Templates",
            RecordID: utils.id
        })
        .then(function(data) {
            data = data.data[0];
            $('#loading').hide();
            txt = (data["Template_Content"]);
            document.getElementById("msgTxt").innerHTML = txt;
            templateSelected = 1;
        })


}

function skip() {
    location.reload();
}

function sendsms() {

    /*
     * get all dynamic placeholders
     */
     
    var msgContent = document.getElementById("msgTxt").value;
    var fields = [];
    var promises = [];
    var messages = [];
    var fieldRegex = /\$\((\w*)\)/g;
    var frmNo = document.getElementById("toNumber").value;
    if(msgContent!="")
    {
        do {


        var match = fieldRegex.exec(msgContent);
        if (match) {
            fields.push(match[1]);
        }

    } while (match);
    /*
     * loop through all message recipients and send sms
     */

    if (recepients) {
        $('#loading').show();
        for (var i in recepients) {
            var message = generatePersonalMessage(msgContent, fields, recepients[i]);
            messages.push(message);
            recepMobile = recepients[i].data.Mobile;
            if(recepMobile == "" || recepMobile == undefined || recepMobile == null)
            {
                recepMobile = recepients[i].data.Phone;
            }
            promise = sendMessage(frmNo, recepMobile, message);
            promises.push(promise);
        }
        
        Promise.all(promises)
            .then(function(data) {
                return showReport(data, messages, frmNo)
            });
        }
    }
    else
    {
       document.getElementById("msgTxt").style.borderColor="#ff0000"; 
       $("#msgEmptyAlert").show();
    }
}

function generatePersonalMessage(message, fields, record) {

    for (var index in fields) {
        var replaceStr = record.data[fields[index]];
        if (fields[index] == "Owner") {
            replaceStr = record.data[fields[index]].name;
        }
        message = message.replace("$(" + fields[index] + ")", replaceStr);
    }
    return message;
}
function sendMessage(frmNo, recepPhone, message) 
{
    var _resolve = undefined;
    var _reject = undefined;
    var temp =  new Promise(function (resolve, reject) {
            _resolve = resolve;
            _reject = reject;
    });

                $.ajax({
                    url : "https://api.twilio.com/2010-04-01/Accounts/" + utils.accntSID + "/Messages.json",
                    type: 'POST',
                    dataType : "json",
                    headers: {"Authorization":"Basic " + utils.encodedAuth},
                    data: {"To" : recepMobile , "From" : frmNo , "Body" : message},
                    success : function(data)
                    {
                        _resolve(data);
                    },
                    error : function(xhr, textStatus, error)
                    {
                        _resolve(xhr.responseJSON);
                    }
                }).catch(function(data){
                    console.log("Error in sendMessage!");
                    console.log(data);
                });

        return temp;
}

/*
function sendMessage(frmNo, recepMobile, message) {
    var promise = $.ajax({
        url : "https://api.twilio.com/2010-04-01/Accounts/" + utils.accntSID + "/Messages.json",
        type: 'POST',
        dataType : "json",
        headers: {"Authorization":"Basic " + utils.encodedAuth},
        data: {"To" : recepMobile , "From" : frmNo , "Body" : message},
        success : function(data){
            return data;
        },
        error : function(data){
            console.log("Error Data is :: ");
            console.log(data);
            return data;
        }
    });
    return promise;
} */

function showReport(data, messages, frmNo) {
    console.log(recepients)
    var status;
    var statusRep = [];
    for (var index in recepients) {
        var mobile = recepients[index].data.Mobile;
        if(mobile == undefined || mobile == null)
        {
            mobile = recepients[index].data.Phone;
        }
        if (data[index].error_code == null && data[index].status != 400) {
            status = "Success";
        } else {
            status = data[index].message;
        }
        statusRep.push({
            Name: recepients[index].data.Full_Name,
            Mobile: mobile,
            Status: status
        })
        if (entity_type == 1) {
            var recData = {
                "Name": recepients[index].data.Full_Name,
                "Message_Sent": messages[index],
                "Status": status,
                "Sent_From": frmNo,
                "Related_Lead": recepients[index].data.id,
                "Template_Used":utils.id
            }
        }
        else if(entity_type == 2){
            var recData = {
                "Name": recepients[index].data.Full_Name,
                "Message_Sent": messages[index],
                "Status": status,
                "Sent_From": frmNo,
                "Related_Contact": recepients[index].data.id,
                "Template_Used":utils.id
            }
        }
        else
        {
            var recData = {
                "Name": recepients[index].data.Full_Name,
                "Message_Sent": messages[index],
                "Status": status,
                "Sent_From": frmNo,
                "Related_L2LAttendee": recepients[index].data.id,
                "Template_Used":utils.id
            }
        }
        ZOHO.CRM.API.insertRecord({
            Entity: "SMS_History",
            APIData: recData
        }).then(function(data) {
            console.log(data);
        })
    }
    var report = $('#reportScript').html();
    var reportTemplate = Handlebars.compile(report);
    $("#statusReport").html(reportTemplate({
        data: statusRep
    }));
    $("#getTemp").hide();
    $("#report").show();
    $('#loading').hide();
}

function closePopUp(toReload) {
    if (toReload) {
        return ZOHO.CRM.UI.Popup.closeReload();
    } else {
        return ZOHO.CRM.UI.Popup.close();
    }

}