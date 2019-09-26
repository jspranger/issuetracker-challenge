/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const expect = require('chai').expect;

const MongoClient = require('mongodb');
const ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB;

let db = undefined;

MongoClient.connect(CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true }, (connErr, client) => {
  if (connErr) {
    console.log(connErr);
  }

  db = client.db("issues");
});
      
module.exports = (app) => {
    app.route('/api/issues/:project')
    .get((req, res) => {
      if (db === undefined) {
        return res.status(500).send('database not responding');
      }
      
      const project = req.params.project;
      
      let queryIssue = {};

      for (var property in req.query) {
        if (req.query.hasOwnProperty(property)) {
          queryIssue[property] = (property == '_id') ?
            ObjectId(req.query[property]) :
            req.query[property];
        }
      }

      let queryResults = [];
      
      db.collection(project).find(queryIssue).toArray((getErr, result) => {
        if (getErr) {
          console.log(getErr);
        }

        return res.json(result);
      });
    })
    .post((req, res) => {
      if (db === undefined) {
        return res.status(500).send('database not responding');
      }
      
      const project = req.params.project;
      
      if (req.body.issue_title === undefined ||
          req.body.issue_text === undefined ||
          req.body.created_by === undefined) {
        return res.status(400).send('missing required fields');
      }
      
      db.collection(project).estimatedDocumentCount({})
      .then(count => {
        const newIssue = {
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to === undefined ? '' : req.body.assigned_to,
          status_text: req.body.status_text === undefined ? '' : req.body.status_text,
          created_on: new Date(),
          updated_on: new Date(),
          open: true
        };
        
        db.collection(project).insertOne(newIssue, (insErr, result) => {
          if (insErr) {
            return res.status(500).send('database not responding');
          }
          
          return res.json(newIssue);
        });
      });
    })
    .put((req, res) => {
      if (db === undefined) {
        return res.status(500).send('database not responding');
      }
      
      const project = req.params.project;
      
      if ( req.body._id === undefined) {
        return res.status(400).send('_id error');
      }

      let updatedIssue = {};
      
      if (req.body.issue_title !== undefined) { updatedIssue['issue_title'] = req.body.issue_title; }
      if (req.body.issue_text !== undefined) { updatedIssue['issue_text'] = req.body.issue_text; }
      if (req.body.created_by !== undefined) { updatedIssue['created_by'] = req.body.created_by; }
      if (req.body.assigned_to !== undefined) { updatedIssue['assigned_to'] = req.body.assigned_to; }
      if (req.body.status_text !== undefined) { updatedIssue['status_text'] = req.body.status_text; }
      if (req.body.open !== undefined) { updatedIssue['open'] = req.body.open; }
      
      if (Object.entries(updatedIssue).length === 0 && updatedIssue.constructor === Object) {
        return res.status(400).send('no updated field sent');
      }
      
      updatedIssue['updated_on'] = new Date();

      db.collection(project).findOneAndUpdate({ _id: ObjectId(req.body._id) }, { $set: updatedIssue }, { returnNewDocument: true },
      (insErr, result) => {
          if (insErr) {
            return res.status(500).send('could not update ' + req.body._id);
          }
          
          return res.send('successfully updated');
        });
    })
    .delete((req, res) => {
      if (db === undefined) {
        return res.status(500).send('database not responding');
      }
      
      const project = req.params.project;

      if (req.body._id === undefined) {
        return res.status(400).send('_id error');
      }
      
      db.collection(project).deleteOne({ _id: ObjectId(req.body._id) }, remErr => {
        if (remErr) {
          return res.status(500).send('could not delete ' + req.body._id);
        }
        
        return res.send('deleted ' + req.body._id);
      });
    });
};
