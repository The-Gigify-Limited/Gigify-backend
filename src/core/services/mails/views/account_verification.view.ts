/**
 * Generate mail html
 * @param {{}} data
 * @returns {string}
 */

export const accountVerificationMail = (data: { otp: string; fullName: string }) => `
<!DOCTYPE html>

<html lang="en-US">

  <head>
    <meta charset="UTF-8" />
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Green hub email">
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Lexend:wght@100;200;300;400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <title>Green hub email: Verify Account</title>
    <style type="text/css">
        a:hover {text-decoration: underline !important;}
    </style>
  </head>
  
  

  <body 
      marginheight="0" 
      topmargin="0" 
      marginwidth="0" 
      style="
             margin: 0px; 
             background-color: #FAFAFA; 
             color: #1C1C1C;
             font-family: 'Lexend', sans-serif;
             " 
      leftmargin="0"
  >
    
    <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; ">
      <tr>
        <td>
          <table 
                 style="
                        max-width:670px;  
                        margin:0 auto;
                        " 
                 width="100%" 
                 border="0"
                 align="center" 
                 cellspacing="0"
           >
            <tr>
                <td 
                  style="
                         
                         text-align:center;
                          background-color: #355312; 
                          border-radius:10px;
                          padding: 10px;
                        "
                    >
                <img 
                    src="https://i.ibb.co/9Vh4v0S/Green-HUrb-Logo3-removebg-preview-2.png"
                     alt="logo" 
                     loading="lazy" 
                     style="margin: 0; padding: 0; box-sizing: border-box;" />
            </td>
            </tr>
            
             <tr>
               <td style="height:20px;">&nbsp;</td>
             </tr>
            
            <tr  
                
              >
              <td style="
            
                  gap: 15px;
                  color: #1C1C1C;
                  margin: 0;
                ">
               <h2 style="
                  
                  margin: 0 0 1em;
                  font-size: 20px;
                  font-weight: 500;
                  line-height: 26.6px;
                  letter-spacing: 0.4px;
                  text-transform: capitalize;
                 
                "
               >
                Hello ${data.fullName}
                </h2>
                 <p
          style="
            margin: 0 0 1em;
     
            font-size: 16px;
            font-weight: 300;
            line-height: 24px;
            letter-spacing: 0.3px;
          "
        >
          It seems you've just created a new account and you are in the process of verifying your account and we're here to assist you every step of the way
        </p>
        <p
          style="
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-size: 16px;
            font-weight: 300;
            line-height: 24px;
            letter-spacing: 0.3px;
          "
        >
          Below is the 4 Digit Code that has been provided for you to verify your account:
        </p>
              </td>
              
              
            </tr>
            
               <tr>
               <td style="height:20px;">&nbsp;</td>
             </tr>
            
            <tr>
              <td>
                 <button
        style="
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-size: 18px;
          font-weight: 700;
          line-height: 24.3px;
          color: #ffffff;
          text-align: center;
          width: 236px;
          max-width: 100%;
          border-radius: 10px;
          padding: 10px 22px;
          background-color: #50870e;
          outline: none;
          border: none;
          letter-spacing: 1rem;
        "
      >
      ${data.otp}
      </button>
      <p
        style="
          margin: 1em 0 0;
          padding: 0;
          box-sizing: border-box;
          font-size: 16px;
          font-weight: 300;
          line-height: 24px;
          letter-spacing: 0.3px;
               color:#1C1C1C;
        "
      >
        We take the security of your account seriously as This code will be invalid after 10 Mins. Ensure not to share this code with anyone
      </p>
              </td>
            </tr>
            
            <tr>
              <td>
                
                   <a
          href="#"
          style="
            margin: .5em 0 0;
            padding: 0;
            box-sizing: border-box;
            font-size: 14px;
            font-weight: 300;
            line-height: 20.3px;
            letter-spacing: 0.28px;
            color: #50870e;
            text-decoration: none;
            margin-bottom: 15px;
            display: block;
          "
          >Contact support
          </a>
                <span style=" font-size: 16px;
            font-weight: 300;
            letter-spacing: 0.32px;">
                 <p style="margin: 0; padding: 0; box-sizing: border-box">
            Warm regards,
          </p>
          <p style="margin: 0; padding: 0; box-sizing: border-box">
            The GreenHUrb Team
          </p>
                </span>
              </td>
            </tr>
              <tr>
               <td style="height:20px;">&nbsp;</td>
             </tr>
            
            <tr>
              <td
        style="
        
          border-radius: 10px;
          width: 100%;
          background-color: #355312;
          padding: 31px 20px;
       
        "
      >
        <p
          style="
           
            font-size: 16px;
            font-weight: 300;
            letter-spacing: 0.32px;
            color: #ffffff;
          "
        >
          House C32, Engr Ebele Okeke Housing Estate, FHA Lugbe. Abuja. Nigeria.
        </p>
        <div
          style="
          
          margin:0 0 1em;
          "
        >
          <img style="width:30px; margin-right:30px;" src='https://svgshare.com/i/yBm.svg' alt='facebook' />
          <img style="width:35px; margin-right:30px;" src='https://svgshare.com/i/yBZ.svg' alt='Linkedin' />
          <img style="width:35px; margin-right:30px;" src='https://svgshare.com/i/yBq.svg' alt='instagram' />
          <img style="width:30px; margin-right:30px;" src='https://svgshare.com/i/yCA.svg' title='twitter' />
        </div>
        <p
          style="
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-size: 14px;
            font-weight: 300;
            line-height: 20.3px;
            letter-spacing: 0.28px;
            color: #ffffff;
          "
        >
          @ copyright 2023. All rights reserved
        </p>

              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      
      
   
    </table>
    <!--/100% body table-->
</body>

</html>

`;
