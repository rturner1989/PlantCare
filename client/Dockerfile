FROM node:20                                                                                                     
                                                                
WORKDIR /plant-care-client                                                                                       
                                                                                                                
COPY package.json package-lock.json ./                                                  
RUN npm install                             

COPY . .

EXPOSE 5173                                                                                                      

CMD ["npm", "run", "dev", "--", "--host"]
