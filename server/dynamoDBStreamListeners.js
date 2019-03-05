'use strict'

module.exports.contactManagementActionNotification = function (event, context) {
  const AWSNotifier = require('./modules/aws-notifier.js')
  const notifier = new AWSNotifier()
  const TOPIC = {
    TopicName: process.env.AUTOMATIC_NOTIFICATIONS_TOPIC_TITLE,
    TopicArn: process.env.AUTOMATIC_NOTIFICATIONS_TOPIC_ARN
  }
  const BASE_URL = process.env.BASE_URL
  const notify = function (note) {
    return new Promise(function (resolve, reject) {
      notifier.publish(note, function (err, data) {
        if (err != null) reject(err)
        else resolve(data)
      })
    })
  }

  let noteTemplate = {
    subject: 'Contact item was managed',
    message: null,
    TopicArn: TOPIC.TopicArn
  }
  event.Records.forEach(function (record) {
    let note = noteTemplate
    if (record.eventName === 'INSERT') {
      note.message = 'New contact was successfully added to the Cloud CRM contact list.\n' +
          '\n' +
          'Contact name: ' + record.dynamodb.NewImage.name.S + '\n' +
          'Contact group: ' + record.dynamodb.NewImage.group_name.S + '\n' +
          'Contact link:' + `http://${BASE_URL}/#/contacts/${record.dynamodb.NewImage.group_id.S}/${record.dynamodb.NewImage.name.S}/view`
    } else if (record.eventName === 'MODIFY') {
      note.message = 'One of your Cloud CRM contacts was successfully modified.\n' +
          '\n' +
          'Contact name: ' + record.dynamodb.NewImage.name.S + '\n' +
          'Contact group: ' + record.dynamodb.NewImage.group_name.S + '\n' +
          'Contact link:' + `http://${BASE_URL}/#/contacts/${record.dynamodb.NewImage.group_id.S}/${record.dynamodb.NewImage.name.S}/view`
    } else return
    notify(note)
      .then(function (data) {
        console.log('Notification is successfully published.\n' + JSON.stringify(data))
      })
      .catch(function (err) {
        console.log('An error occured: ' + JSON.stringify(err))
      })
  })
}
module.exports.companiesTableController = function (event, context) {
  const AWS = require('aws-sdk')
  const DynamoDB = new AWS.DynamoDB.DocumentClient()
  const isCompanyNew = function (record) {
    return new Promise(function (resolve, reject) {
      let params = {
        TableName: process.env.COMPANIES_TABLE,
        Key: {
          company_normalized: record.dynamodb.NewImage.company_normalized.S
        }
      }
      DynamoDB.get(params, function (err, data) {
        console.log(data)
        if (err != null) reject(err)
        else if ('Item' in data) reject(null)
        else resolve(record)
      })
    })
  }
  const recordCompany = function (record) {
    return new Promise(function (resolve, reject) {
      let params = {
        TableName: process.env.COMPANIES_TABLE,
        Item: {
          company_normalized: record.dynamodb.NewImage.company_normalized.S,
          company_name: record.dynamodb.NewImage.company_name.S
        }
      }
      DynamoDB.put(params, function (err, data) {
        if (err != null) reject(err)
        else resolve(record)
      })
    })
  }

  event.Records.forEach(function (record) {
    if (record.eventName !== 'INSERT') return
    isCompanyNew(record)
      .then(recordCompany, function (err) {
        if (err != null) console.log(JSON.stringify(err))
        else console.log('Company already exists')
      })
      .then(function (record) {
        console.log('Company is successfully recorded')
      }, function (err) {
        console.log(JSON.stringify(err))
      })
  })
}
