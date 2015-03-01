var googleapi = {
    authorize: function(options) {
        var deferred = $.Deferred();

        //Build the OAuth consent page URL
        var authUrl = 'https://accounts.google.com/o/oauth2/auth?' + $.param({
            client_id: options.client_id,
            redirect_uri: options.redirect_uri,
            response_type: 'code',
            scope: options.scope
        });

        //Open the OAuth consent page in the InAppBrowser
        var authWindow = window.open(authUrl, '_blank', 'location=no,toolbar=no');

        //The recommendation is to use the redirect_uri "urn:ietf:wg:oauth:2.0:oob"
        //which sets the authorization code in the browser's title. However, we can't
        //access the title of the InAppBrowser.
        //
        //Instead, we pass a bogus redirect_uri of "http://localhost", which means the
        //authorization code will get set in the url. We can access the url in the
        //loadstart and loadstop events. So if we bind the loadstart event, we can
        //find the authorization code and close the InAppBrowser after the user
        //has granted us access to their data.
        $(authWindow).on('loadstart', function(e) {
            var url = e.originalEvent.url;
            var code = /\?code=(.+)$/.exec(url);
            var error = /\?error=(.+)$/.exec(url);

            if (code || error) {
                //Always close the browser when match is found
                authWindow.close();
            }

            if (code) {
                //Exchange the authorization code for an access token
                $.post('https://accounts.google.com/o/oauth2/token', {
                    code: code[1],
                    client_id: options.client_id,
                    client_secret: options.client_secret,
                    redirect_uri: options.redirect_uri,
                    grant_type: 'authorization_code'
                }).done(function(data) {
                    deferred.resolve(data);
                }).fail(function(response) {
                    deferred.reject(response.responseJSON);
                });
            } else if (error) {
                //The user denied access to the app
                deferred.reject({
                    error: error[1]
                });
            }
        });

        return deferred.promise();
    }
};

$(document).on('deviceready', function() {
    var $loginButton = $('#login a');

    $loginButton.on('click', function() {
        googleapi.authorize({
            client_id: '656534411560-nvp2q0ambtajjlosk9bi5dijjkmaifae.apps.googleusercontent.com',
            client_secret: 'miFdeYaKxq1hsbBdql7-KRJP',
            redirect_uri: 'http://localhost',
            scope: 'https://www.googleapis.com/auth/calendar'
        }).done(function(data) {
            $(':mobile-pagecontainer').pagecontainer('change', '#p2');
            $.ajax(
                'https://www.googleapis.com/calendar/v3/calendars/raychien1025@gmail.com/events',
                {
                  type: 'GET',
                  dataType: 'json',
                  headers: {
                    'Authorization': 'Bearer ' + data.access_token
                  },
                  success: function (resp) {
                    $('#event-list li').remove();
                    var list = resp.items;
                    $.each(list, function(i, e) {
                        var StartDateTime = e.start.dateTime.split(/\T(\d{2}\:\d{2})/);
                        var EndDateTime = e.end.dateTime.split(/\T(\d{2}\:\d{2})/);
                        $('#event-list').append(
                            '<li><h4>' + e.summary + '</h4>'
                            + '<p>' + e.location + '</p>'
                            + '<p>' + StartDateTime[1] + ' - ' + EndDateTime[1] + '</p>'
                            + '<p class="ui-li-aside">' + StartDateTime[0] + '</p></li>'
                        );
                    });
                    $('#event-list').listview('refresh');
                    setTimeout(function(){ 
                        $('#alert-event').append('There is an traffic jam on event "' + list[0].summary + '".');
                        $(':mobile-pagecontainer').pagecontainer('change', '#p3');
                    }, 3000);
                  },
                  error: function (jqXHR, textStatus, errorThrown) {
                    $loginStatus.html(textStatus);
                  }
                }
            );
        }).fail(function(data) {
            $loginStatus.html(data.error);
        });
    });
});