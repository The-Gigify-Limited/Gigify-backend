interface EventInvitationMail {
    firstName: string;
    lastName: string;
    eventPhoto: string;
    eventName: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    qrCode: string;
}

export const eventRegistrationMail2 = (data: EventInvitationMail) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">

  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <style>
      @font-face {
        font-style: normal;
        font-family: Montserrat;
        font-weight: 400;
        mso-font-alt: Verdana;
        src: url(https://github.com/capptions/font-roboto/raw/master/fonts/Roboto-Bold.woff2) format(woff2);
      }

      * {
        font-family: Montserrat, Verdana;
      }
    </style>
  </head>  
  </div>



  <body style="background-color:#F6F6F6">
    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:100%;width:612px;margin:0 auto">
      <tbody>
        <tr style="width:100%">
          <td>
            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
              <tbody>
                <tr>
                  <td><img height="47" src="https://res.cloudinary.com/dinrq1kf4/image/upload/v1713952702/Nithub/NITPROFILE_ASSETS/NITHUB%20LOGO-2105898835.png" style="display:block;outline:none;border:none;text-decoration:none;object-fit:cover" width="132" /></td>
                </tr>
              </tbody>
            </table>
            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:100%;margin-top:2rem;width:100%;background-color:#ffffff;border-radius:16px;box-shadow:0 5px 10px rgba(20,50,70,.2)">
              <tbody>
                <tr style="width:100%">
                  <td>
                    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                      <tbody>
                        <tr>
                          <td><img height="290" src="${data.eventPhoto}" style="display:block;outline:none;border:none;text-decoration:none;border-radius:16px;width:100%;object-fit:cover" /></td>
                        </tr>
                      </tbody>
                    </table>
                    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="padding:0 24px 0;margin-block:3em">
                      <tbody>
                        <tr>
                          <td>
                            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                              <tbody>
                                <tr>
                                  <td>
                                    <h2 style="margin:40px 0 15px;font-weight:medium;font-size:18px;line-height:21px;color:#3c3f44">Dear ${data.lastName} ${data.firstName}</h2>
                                    <p style="font-size:16px;line-height:37px;margin:16px 0;color:#3c3f44">Thank you for registering for ${data.eventName}! We are excited to have you join us and look forward to an engaging and insightful experience. Below you will find important details regarding the event:</p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                              <tbody>
                                <tr>
                                  <td>
                                    <h2 style="margin:40px 0 15px;font-weight:medium;font-size:18px;line-height:21px;color:#3c3f44">Event Details:</h2>
                                    <ul>
                                      <li>
                                        <p style="font-size:16px;line-height:25px;margin:16px 0;color:#3c3f44">Event Title: ${data.eventName} </p>
                                      </li>
                                      <li>
                                        <p style="font-size:16px;line-height:25px;margin:16px 0;color:#3c3f44">Date: ${data.eventDate}</p>
                                      </li>
                                      <li>
                                        <p style="font-size:16px;line-height:25px;margin:16px 0;color:#3c3f44">Time: ${data.eventTime}</p>
                                      </li>
                                      <li>
                                        <p style="font-size:16px;line-height:25px;margin:16px 0;color:#3c3f44">Location: ${data.eventLocation}.</p>
                                      </li>
                                    </ul>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="display:flex;align-items:center;gap:1em">
                              <tbody>
                                <tr>
                                  <td>
                                    <h2 style="margin:40px 0 15px;font-weight:medium;font-size:18px;line-height:21px;color:#3c3f44">Access Pass</h2>
                                    <p style="font-size:16px;line-height:37px;margin:16px 0;color:#3c3f44">Attached to this email is your QR code. Please present this code at the entrance; it will serve as your pass to access the event.</p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                              <tbody>
                                <tr>
                                  <td><img height="160" src="${data.qrCode}" style="display:block;outline:none;border:none;text-decoration:none;border-radius:10px" width="160" /></td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="background:linear-gradient(to right top, red, green);width:90%;marign:0 auto;height:4px">
                      <tbody>
                        <tr>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="width:680px;max-width:100%;margin:32px auto 0 auto;padding:0 30px">
                      <tbody>
                        <tr>
                          <td>
                            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                              <tbody style="width:100%">
                                <tr style="width:100%">
                                  <p style="font-size:14px;line-height:24px;margin:16px 0;text-align:center;color:#706a7b">This email was sent to you regarding your registration for the nitdev event. <br />If you wish to no longer receive emails from us you can<!-- --> <span style="color:#099137;cursor:pointer">Unsubscribe</span></p>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin-block:3rem">
                              <tbody style="width:100%">
                                <tr style="width:100%">
                                  <td align="right" data-id="__react-email-column" style="width:50%;padding-right:8px;cursor:pointer"><img src="https://res.cloudinary.com/dinrq1kf4/image/upload/v1714050577/IMAGE_7_u5vhmc.png" style="display:block;outline:none;border:none;text-decoration:none" /></td>
                                  <td align="left" data-id="__react-email-column" style="width:50%;padding-left:8px;cursor:pointer"><img src="https://res.cloudinary.com/dinrq1kf4/image/upload/v1714050577/IMAGE_8_qaqb6n.png" style="display:block;outline:none;border:none;text-decoration:none" /></td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>

</html>
`;

export const eventRegistrationMail = (data: EventInvitationMail) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">

  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <style>
      @font-face {
        font-style: normal;
        font-family: Avenir Roman;
        font-weight: 400;
        mso-font-alt: Verdana;
        src: url(https://res.cloudinary.com/dinrq1kf4/raw/upload/v1714124168/avenir_roman_12_u726nh.woff) format(woff);
      }

      * {
        font-family: Avenir Roman, Verdana;
      }
    </style>
  </head>
  </div>

  <body style="background-color:#F6F6F6">
    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:100%;width:612px;margin:0 auto">
      <tbody>
        <tr style="width:100%">
          <td>
            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin-top:2em">
              <tbody>
                <tr>
                  <td><img height="47" src="https://res.cloudinary.com/dinrq1kf4/image/upload/v1713952702/Nithub/NITPROFILE_ASSETS/NITHUB%20LOGO-2105898835.png" style="display:block;outline:none;border:none;text-decoration:none;object-fit:cover" width="132" /></td>
                </tr>
              </tbody>
            </table>
            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="max-width:100%;margin-block:2rem;width:100%;background-color:#ffffff;border-radius:16px;box-shadow:0 5px 10px rgba(20,50,70,.2)">
              <tbody>
                <tr style="width:100%">
                  <td>
                    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                      <tbody>
                        <tr>
                          <td><img height="290" src="${data.eventPhoto}" style="display:block;outline:none;border:none;text-decoration:none;border-radius:16px;width:100%;object-fit:cover" /></td>
                        </tr>
                      </tbody>
                    </table>
                    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="padding:0 24px 0;margin-block:3em">
                      <tbody>
                        <tr>
                          <td>
                            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                              <tbody>
                                <tr>
                                  <td>
                                    <h2 style="margin:40px 0 15px;font-weight:medium;font-size:18px;line-height:21px;color:#3c3f44">Dear ${data.lastName} ${data.firstName}</h2>
                                    <p style="font-size:16px;line-height:37px;margin:16px 0;color:#3c3f44">Thank you for registering for ${data.eventName}! We are excited to have you join us and look forward to an engaging and insightful experience. Below you will find important details regarding the event:</p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                              <tbody>
                                <tr>
                                  <td>
                                    <h2 style="margin:40px 0 15px;font-weight:medium;font-size:18px;line-height:21px;color:#3c3f44">Event Details:</h2>
                                    <ul>
                                      <li>
                                        <p style="font-size:16px;line-height:25px;margin:16px 0;color:#3c3f44">Event Title: ${data.eventName} </p>
                                      </li>
                                      <li>
                                        <p style="font-size:16px;line-height:25px;margin:16px 0;color:#3c3f44">Date: ${data.eventDate}</p>
                                      </li>
                                      <li>
                                        <p style="font-size:16px;line-height:25px;margin:16px 0;color:#3c3f44">Time: ${data.eventTime}</p>
                                      </li>
                                      <li>
                                        <p style="font-size:16px;line-height:25px;margin:16px 0;color:#3c3f44">Location: ${data.eventLocation}.</p>
                                      </li>
                                    </ul>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="display:flex;align-items:center;gap:1em">
                              <tbody>
                                <tr>
                                  <td>
                                    <h2 style="margin:40px 0 15px;font-weight:700;font-size:18px;font-style:normal;line-height:21px;color:#3c3f44">Access Pass</h2>
                                    <p style="font-size:16px;line-height:37px;margin:16px 0;color:#3c3f44">Attached to this email is your QR code. Please present this code at the entrance; it will serve as your pass to access the event.</p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                              <tbody>
                                <tr>
                                  <td><img height="160" src="${data.qrCode}" style="display:block;outline:none;border:none;text-decoration:none;border-radius:10px" width="160" /></td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="background:linear-gradient(to right top, red, green);width:90%;marign:0 auto;height:4px">
                      <tbody>
                        <tr>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                    <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="width:680px;max-width:100%;margin:32px auto 0 auto;padding:0 30px">
                      <tbody>
                        <tr>
                          <td>
                            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation">
                              <tbody style="width:100%">
                                <tr style="width:100%">
                                  <p style="font-size:14px;line-height:24px;margin:16px 0;text-align:center;color:#706a7b">This email was sent to you regarding your registration for the nitdev event. <br />If you wish to no longer receive emails from us you can<!-- --> <span style="color:#099137;cursor:pointer">Unsubscribe</span></p>
                                </tr>
                              </tbody>
                            </table>
                            <table align="center" width="100%" border="0" cellPadding="0" cellSpacing="0" role="presentation" style="margin-block:3rem">
                              <tbody style="width:100%">
                                <tr style="width:100%">
                                  <td align="right" data-id="__react-email-column" style="width:50%;padding-right:8px;cursor:pointer"><img src="https://res.cloudinary.com/dinrq1kf4/image/upload/v1714050577/IMAGE_7_u5vhmc.png" style="display:block;outline:none;border:none;text-decoration:none" /></td>
                                  <td align="left" data-id="__react-email-column" style="width:50%;padding-left:8px;cursor:pointer"><img src="https://res.cloudinary.com/dinrq1kf4/image/upload/v1714050577/IMAGE_8_qaqb6n.png" style="display:block;outline:none;border:none;text-decoration:none" /></td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>

</html>
`;
