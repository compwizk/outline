// @flow
import { observer } from "mobx-react";
import * as React from "react";
import { Trans, useTranslation } from "react-i18next";
import { changeLanguage, detectLanguage } from "../utils/language";
import useStores from "../hooks/useStores";
import { setCookie, removeCookie } from "tiny-cookie";

import CenteredContent from "components/CenteredContent";
import Flex from "components/Flex";
import Heading from "components/Heading";
import NoticeAlert from "components/NoticeAlert";
import InputLarge from "components/InputLarge";
import ButtonLarge from "components/ButtonLarge";

function LoginPrompt() {
  const { t, i18n } = useTranslation(); // TODO
  const { auth } = useStores();
  const { config } = auth;
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  removeCookie("ldap-prompt"); // Ensure clean environment

  React.useEffect(() => {
    auth.fetchConfig();
  }, [auth]);

  // TODO: Persist detected language to new user
  // Try to detect the user's language and show the login page on its idiom
  // if translation is available
  React.useEffect(() => {
    changeLanguage(detectLanguage(), i18n);
  }, [i18n]);


  if (auth.authenticated) {
    window.location.replace('/home');
  }

  // we're counting on the config request being fast
  if (!config) {
    return null;
  }

  // ApiClient.js doesn't give enough control
  const auth_request = async () => {
    let headerOptions = {
      Accept: "application/json",
      "cache-control": "no-cache",
      pragma: "no-cache",
      "Content-Type": "application/json"
    };
    const headers = new Headers(headerOptions);
    // FIXME: if not using SSL, this is transmitted completely in the clear
    const body = JSON.stringify({username: username, password: password});

    setCookie("ldap-prompt", true, { SameSite: 'lax' }); // Cookie used to indicate user prompt was displayed
    const response = await fetch('/auth/ldap', {
      method: "POST",
      body,
      headers,
      redirect: "follow",
      cache: "no-cache",
    });
    removeCookie("ldap-prompt"); // Ensure clean state post response
    if (response.status == 200){
      // Remove current page from history and try to browse home
      window.location.replace('/home');
    } else if (response.status == 401) {
      setErrorMessage("Invalid Username or Password!");
    } else {
      setErrorMessage("Error!");
    }
  }

  return (<CenteredContent>
          <Flex align="center" column={true}>
            <Heading>Outline Login</Heading>
            <div style={{display: !!errorMessage?"inline-block":"none"}}><NoticeAlert>{errorMessage}</NoticeAlert></div>
            <InputLarge type="text" placeholder="Username" short required onChange={(event) => {setUsername(event.target.value)}} />
            <InputLarge type="password" placeholder="Password" short required onChange={(event) => {setPassword(event.target.value)}} />
            <ButtonLarge onClick={() => {auth_request()}}>Login</ButtonLarge>
          </Flex>
          </CenteredContent>);
};

export default observer(LoginPrompt);
