import * as express from 'express';
import * as path from 'path';
const fs = require('fs');
const dotenv = require('dotenv');
// https://github.com/motdotla/dotenv#what-happens-to-environment-variables-that-were-already-set
const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
if (envConfig) {
  for (const key in envConfig) {
    if (envConfig.hasOwnProperty(key)) {
      process.env[key] = envConfig[key];
    }
  }
}
import * as bodyParser from 'body-parser';
import { createConnection } from 'typeorm';
const authController = require('./routes/authentication.controller');
const orgController = require('./routes/organization.controller');
const userController = require('./routes/user.controller');
const fileUploadController = require('./routes/file-upload.controller');
import * as assetController from './routes/asset.controller';
import * as assessmentController from './routes/assessment.controller';
import * as vulnController from './routes/vulnerability.controller';
import * as jwtMiddleware from './middleware/jwt.middleware';
import * as JiraApi from 'jira-client';
const puppeteerUtility = require('./utilities/puppeteer.utility');
const helmet = require('helmet');
const cors = require('cors');
const app = express();
app.use(helmet());
app.use(cors());
app.use(
  express.static(path.join(__dirname, '../frontend/dist/frontend'), {
    etag: false
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
export const jira = new JiraApi({
  protocol: 'https',
  host: process.env.JIRA_HOST,
  username: process.env.JIRA_USERNAME,
  password: process.env.JIRA_API_KEY,
  apiVersion: '3',
  strictSSL: true
});
const serverPort = process.env.PORT || 5000;
const serverIpAddress = process.env.IP || '127.0.0.1';
app.set('port', serverPort);
app.set('serverIpAddress', serverIpAddress);
// tslint:disable-next-line: no-console
app.listen(serverPort, () => console.info(`Server running on ${serverIpAddress}:${serverPort}`));
// create typeorm connection
createConnection().then((_) => {
  // register routes
  app.post('/api/user/register', userController.register);
  app.post('/api/user/invite', jwtMiddleware.checkToken, userController.invite);
  app.patch('/api/user', jwtMiddleware.checkToken, userController.patch);
  app.get('/api/user', jwtMiddleware.checkToken, userController.getUser);
  app.get('/api/users', jwtMiddleware.checkToken, userController.getUsers);
  app.get('/api/user/verify/:uuid', userController.verify);
  app.patch('/api/forgot-password', authController.forgotPassword);
  app.patch('/api/password-reset', authController.resetPassword);
  app.post('/api/refresh', jwtMiddleware.checkRefreshToken, authController.refreshSession);
  app.patch('/api/user/password', userController.updateUserPassword);
  app.post('/api/login', authController.login);
  app.post('/api/upload', jwtMiddleware.checkToken, fileUploadController.uploadFile);
  app.get('/api/file/:id', jwtMiddleware.checkToken, fileUploadController.getFileById);
  app.get('/api/organization', jwtMiddleware.checkToken, orgController.getActiveOrgs);
  app.get('/api/organization/archive', jwtMiddleware.checkToken, orgController.getArchivedOrgs);
  app.get('/api/organization/:id', jwtMiddleware.checkToken, orgController.getOrgById);
  app.patch('/api/organization/:id/archive', jwtMiddleware.checkToken, orgController.archiveOrgById);
  app.patch('/api/organization/:id/activate', jwtMiddleware.checkToken, orgController.activateOrgById);
  app.patch('/api/organization/:id', jwtMiddleware.checkToken, orgController.updateOrgById);
  app.post('/api/organization', jwtMiddleware.checkToken, orgController.createOrg);
  app.get('/api/organization/asset/:id', jwtMiddleware.checkToken, assetController.getOrgAssets);
  app.get('/api/organization/:id/asset/archive', jwtMiddleware.checkToken, assetController.getArchivedOrgAssets);
  app.post('/api/organization/:id/asset', jwtMiddleware.checkToken, assetController.createAsset);
  app.get('/api/organization/:id/asset/:assetId', jwtMiddleware.checkToken, assetController.getAssetById);
  app.patch('/api/organization/:id/asset/:assetId', jwtMiddleware.checkToken, assetController.updateAssetById);
  app.patch('/api/asset/archive/:assetId', jwtMiddleware.checkToken, assetController.archiveAssetById);
  app.patch('/api/asset/activate/:assetId', jwtMiddleware.checkToken, assetController.activateAssetById);
  app.get('/api/assessment/:id', jwtMiddleware.checkToken, assessmentController.getAssessmentsByAssetId);
  app.get('/api/assessment/:id/vulnerability', jwtMiddleware.checkToken, assessmentController.getAssessmentVulns);
  app.post('/api/assessment', jwtMiddleware.checkToken, assessmentController.createAssessment);
  app.delete('/api/assessment/:assessmentId', jwtMiddleware.checkToken, assessmentController.deleteAssessmentById);
  app.get(
    '/api/asset/:assetId/assessment/:assessmentId',
    jwtMiddleware.checkToken,
    assessmentController.getAssessmentById
  );
  app.patch(
    '/api/asset/:assetId/assessment/:assessmentId',
    jwtMiddleware.checkToken,
    assessmentController.updateAssessmentById
  );
  app.get(
    '/api/assessment/:assessmentId/report',
    jwtMiddleware.checkToken,
    assessmentController.queryReportDataByAssessment
  );
  app.post('/api/report/generate', jwtMiddleware.checkToken, puppeteerUtility.generateReport);
  app.get('/api/vulnerability/:vulnId', jwtMiddleware.checkToken, vulnController.getVulnById);
  app.delete('/api/vulnerability/:vulnId', jwtMiddleware.checkToken, vulnController.deleteVulnById);
  app.patch('/api/vulnerability/:vulnId', jwtMiddleware.checkToken, vulnController.patchVulnById);
  app.post('/api/vulnerability', jwtMiddleware.checkToken, vulnController.createVuln);
  app.get('/api/vulnerability/jira/:vulnId', jwtMiddleware.checkToken, vulnController.exportToJira);
});
