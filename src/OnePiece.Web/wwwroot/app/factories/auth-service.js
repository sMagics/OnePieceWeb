﻿function AuthServiceFactory($http, $q, localStorageService, ngAuthSettings) {

    var serviceBase = ngAuthSettings.apiServiceBaseUri;
    var authServiceFactory = {};

    var _authentication = {
        isAuth: false,
        userName: "",
        userRole: "",
        isAdmin: false,
        useRefreshTokens: false,
        userInfo: {}
    };

    var _externalAuthData = {
        provider: "",
        userName: "",
        userRole: "",
        isAuth: false,
        externalAccessToken: ""
    };

    var _saveRegistration = function (registration) {

        _logOut();

        return $http.post(serviceBase + 'api/account/register', registration).then(function (response) {
            return response;
        });

    };

    var _login = function (loginData) {

        var data = "grant_type=password&username=" + loginData.userName + "&password=" + loginData.password;

        if (loginData.useRefreshTokens) {
            data = data + "&client_id=" + ngAuthSettings.clientId;
        }

        var deferred = $q.defer();

        $http.post(serviceBase + 'token', data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).success(function (response) {
            _authentication.isAdmin = response.userRoles === 'Admin' || response.userRoles === 'SuperAdmin';

            if (loginData.useRefreshTokens) {
                localStorageService.set('authorizationData', { token: response.access_token, userName: response.userName, userRole: response.userRoles, isAdmin: _authentication.isAdmin, userInfo: response.userInfo, refreshToken: response.refresh_token, useRefreshTokens: true });
            }
            else {
                localStorageService.set('authorizationData', { token: response.access_token, userName: response.userName, userRole: response.userRoles, isAdmin: _authentication.isAdmin, userInfo: response.userInfo, refreshToken: "", useRefreshTokens: false });
            }

            _authentication.isAuth = true;
            _authentication.userName = response.userName;
            _authentication.userRole = response.userRoles;
            _authentication.useRefreshTokens = loginData.useRefreshTokens;
            _authentication.userInfo = JSON.parse(response.userInfo);

            deferred.resolve(response);

        }).error(function (err, status) {
            _logOut();
            deferred.reject(err);
        });

        return deferred.promise;

    };

    var _logOut = function () {

        localStorageService.remove('authorizationData');

        _authentication.isAuth = false;
        _authentication.userName = "";
        _authentication.useRefreshTokens = false;
        _authentication.userInfo = {};

    };

    var _fillAuthData = function () {

        var authData = localStorageService.get('authorizationData');
        if (authData) {
            _authentication.isAuth = true;
            _authentication.userName = authData.userName;
            _authentication.userRole = authData.userRoles;
            _authentication.isAdmin = authData.isAdmin;
            _authentication.useRefreshTokens = authData.useRefreshTokens;
            _authentication.userInfo = authData.userInfo ? JSON.parse(authData.userInfo) : {};
        }

    };

    var _updateProfile = function (profileInfo) {
        profileInfo.UserName = _authentication.userName;
        return $http.post(serviceBase + 'api/account/update', profileInfo).then(function (response) {
            return response;
        });
    };

    var _getUserProfile = function (inputUsername) {
        var url = hostName + 'api/account/user';

        return $http.get(url, {
            params: {
                userName: inputUsername
            }
        }).then(function (response) {
            return response;
        });
    };

    var _changePassword = function (oldPassword, newPassword, newPasswordRetype) {
        var passwordData = {
            OldPassword: oldPassword,
            NewPassword: newPassword,
            ConfirmPassword: newPasswordRetype,
        };

        return $http.post(serviceBase + 'api/account/changepassword', passwordData).then(function (response) {
            return response;
        });
    };

    var _refreshToken = function () {
        var deferred = $q.defer();

        var authData = localStorageService.get('authorizationData');

        if (authData) {

            if (authData.useRefreshTokens) {

                var data = "grant_type=refresh_token&refresh_token=" + authData.refreshToken + "&client_id=" + ngAuthSettings.clientId;

                localStorageService.remove('authorizationData');

                $http.post(serviceBase + 'token', data, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).success(function (response) {

                    localStorageService.set('authorizationData', { token: response.access_token, userName: response.userName, userInfo: response.userInfo, userRole: response.userRoles, isAdmin: _authentication.isAdmin, refreshToken: response.refresh_token, useRefreshTokens: true });

                    deferred.resolve(response);

                }).error(function (err, status) {
                    _logOut();
                    deferred.reject(err);
                });
            }
        }

        return deferred.promise;
    };

    var _obtainAccessToken = function (externalData) {

        var deferred = $q.defer();

        $http.get(serviceBase + 'api/account/ObtainLocalAccessToken', { params: { provider: externalData.provider, externalAccessToken: externalData.externalAccessToken } }).success(function (response) {
            _authentication.isAdmin = response.userRoles === 'Admin' || response.userRoles === 'SuperAdmin';

            localStorageService.set('authorizationData', { token: response.access_token, userName: response.userName, userRole: response.userRoles, isAdmin: _authentication.isAdmin, userInfo: response.userInfo, refreshToken: "", useRefreshTokens: false });
            _authentication.isAuth = true;
            _authentication.userName = response.userName;
            _authentication.userRole = response.userRoles;
            _authentication.useRefreshTokens = false;
            _authentication.userInfo = JSON.parse(response.userInfo);

            deferred.resolve(response);

        }).error(function (err, status) {
            _logOut();
            deferred.reject(err);
        });

        return deferred.promise;

    };

    var _registerExternal = function (registerExternalData) {

        var deferred = $q.defer();

        $http.post(serviceBase + 'api/account/registerexternal', registerExternalData).success(function (response) {
            _authentication.isAdmin = response.userRoles === 'Admin' || response.userRoles === 'SuperAdmin';

            localStorageService.set('authorizationData', { token: response.access_token, userName: response.userName, userRole: response.userRoles, isAdmin: _authentication.isAdmin, userInfo: response.userInfo, refreshToken: "", useRefreshTokens: false });

            _authentication.isAuth = true;
            _authentication.userName = response.userName;
            _authentication.userRole = response.userRoles;
            _authentication.useRefreshTokens = false;
            _authentication.userInfo = JSON.parse(response.userInfo);

            deferred.resolve(response);

        }).error(function (err, status) {
            _logOut();
            deferred.reject(err);
        });

        return deferred.promise;

    };

    authServiceFactory.saveRegistration = _saveRegistration;
    authServiceFactory.login = _login;
    authServiceFactory.logOut = _logOut;
    authServiceFactory.fillAuthData = _fillAuthData;
    authServiceFactory.updateProfile = _updateProfile;
    authServiceFactory.getUserProfile = _getUserProfile;
    authServiceFactory.changePassword = _changePassword;
    authServiceFactory.authentication = _authentication;
    authServiceFactory.refreshToken = _refreshToken;

    authServiceFactory.obtainAccessToken = _obtainAccessToken;
    authServiceFactory.externalAuthData = _externalAuthData;
    authServiceFactory.registerExternal = _registerExternal;

    return authServiceFactory;
}