function onFormSumbit(){
  
  //ids
  const sheet_id = "SHEET_ID";
  const main_fol_id = "MAIN_FOL_ID";
  const form_fol_id = "FORM_FOL_ID";
  const form_id = "FORM_ID";
  
  //open sheet of form responses
  var sheet = SpreadsheetApp.openById(sheet_id);
  var diario = sheet.getSheetByName("respuestas");
  
  //get last row to replace new_url of file
  var lastRow = diario.getLastRow();
  
  
  //open folder where file will be re-placed
  var facturasmainfolder = DriveApp.getFolderById(main_fol_id);
  
  //open folder where files are placed
  var facturaformfolder = DriveApp.getFolderById(form_fol_id);
  
  
  //open form
  var form = FormApp.openById(form_id);
  
  //initiate variables to save responses
  var titles = [];
  var responses = [];
  var formResponses = form.getResponses();
  
  //save into a string all responses to send to slack
  var all = "";
  var doble = [];
  
  //get last response
  var formResponse = formResponses[formResponses.length-1];
  
  //get email
  var email_cand = formResponse.getRespondentEmail();
  
  //get all itemes
  var itemResponses = formResponse.getItemResponses();
  
  
  //loop through all items to save it
  for (var j = 0; j < itemResponses.length; j++) {
    
    var itemResponse = itemResponses[j];

    var title =itemResponse.getItem().getTitle();
    titles[j] = title;
    Logger.log(titles[j]);
    
    var response = itemResponse.getResponse()
    responses[j] = response;
    
    //guardar toda la info
    doble[j] = '*'+String(title)+"* "+String(response)+"\n";
    all=all+doble[j];
    
    //coger nombre
    if(title=='Nombre'){
      var name_name=responses[j];
    } 
     
  }
  
  
  
  //subir el archivo a la carpeta de facturas
  var files = facturaformfolder.getFiles();
  var file=files.next();
  var newfile = file.makeCopy(facturasmainfolder);
  newfile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
  file.setTrashed(true);
  var newurl = newfile.getUrl();
  diario.getRange(lastRow, 17).setValue(newurl);
  
  //update html to send email
  var htmlBody=HtmlService.createTemplateFromFile('respuesta_email');
  htmlBody.name = String(name_name);
  htmlBody.url = String(newurl);

  
  var email = '"'+name_name+'"<'+email_cand+">";
  htmlBody = htmlBody.evaluate().getContent();
  MailApp.sendEmail({
    to: email,
    cc:'contacto@oaninternational.org,president@oaninternational.org',
    //to: 'president@oaninternational.org',
    subject: 'Solicitud de '+name_name+' recibida',
    htmlBody: htmlBody,
  });
  sendslackmessage(name_name,all,newurl);


}


function sendslackmessage(nombre, all, newurl){
  var pass_sheet = SpreadsheetApp.openById("1ILSXJ9m-Qers5ljEILs6Quyl-PQ3FWzCrhL3ossEipY");
  var tab_api = pass_sheet.getSheetByName("APIs");
  var contabilidad_key= String(tab_api.getSheetValues(5, 3, 1, 1));
  
  var channel = 'CHANNEL';
  
  var slack_url = "https://slack.com/api/chat.postMessage";
  
  var API_KEY=contabilidad_key;
  
  var today = Utilities.formatDate(new Date(), "GMT+1", "dd/MM/yyyy");
  
  var data = {
    "channel": channel,
    "text": 'Solicitud de candidato '+ String(today)+'\nNombre: '+nombre+'\n Link CV: '+newurl
  };
  
  var options = {
    "headers": {"authorization": 'Bearer '+API_KEY},
    'contentType': 'application/json',
    'payload' : JSON.stringify(data)
  };
  var response = UrlFetchApp.fetch(slack_url, options);
  var responsetext = JSON.parse(response.getContentText());
  
  var data2 = {
    "channel": channel,
    "thread_ts": responsetext.ts,
    "text": all
  };
  var options2 = {
    "headers": {"authorization": 'Bearer '+API_KEY},
    'contentType': 'application/json',
    'payload' : JSON.stringify(data2)
  };
  
  UrlFetchApp.fetch(slack_url, options2);

}
