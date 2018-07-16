### brigade install

```
helm repo add brigade https://azure.github.io/brigade
    
helm install -n brigade brigade/brigade --set rbac.enabled=false --set vacuum.enabled=false --set api.service.type=LoadBalancer --namespace=brigade
```

### brigade project

show `brig-proj.yaml`

```helm install --name brig-proj-kubecon-web brigade/brigade-project -f brig-proj-kubecon.yaml```

### brigade.js

1. 
    ```
    // variables
    var acrServer = project.secrets.acrServer
    ```
2. 
    ```
    var acrName = project.secrets.acrName
    var azServicePrincipal = project.secrets.azServicePrincipal
    var azClientSecret = project.secrets.azClientSecret
    var azTenant = project.secrets.azTenant
    var gitPayload = JSON.parse(brigadeEvent.payload)
    var today = new Date()
    var image = "chzbrgr71/kubecon-rating-web"
    var gitSHA = brigadeEvent.revision.commit.substr(0,7)
    var imageTag = "master-" + String(gitSHA)
    var acrImage = image + ":" + imageTag
    ```
3. 
    ```
    console.log(`==> gitHub webook with commit ID ${gitSHA}`)
    ```
4. 
    ```
    var acr = new Job("job-runner-acr-builder")
    ```
5. 
    ```
    acr.storage.enabled = false
    acr.image = "briaracreu.azurecr.io/chzbrgr71/azure-cli:0.0.5"
    acr.tasks = [
        `cd /src/app/web`,
        `az login --service-principal -u ${azServicePrincipal} -p ${azClientSecret} --tenant ${azTenant}`,
        `az acr build -t ${acrImage} --build-arg BUILD_DATE="${String(today)}" --build-arg VCS_REF=${gitSHA} --build-arg IMAGE_TAG_REF=${imageTag} -f ./Dockerfile --context . -r ${acrName}`
    ]
    ```
6. 
    ```
    var helm = new Job("job-runner-helm")
    helm.storage.enabled = false
    helm.image = "briaracreu.azurecr.io/chzbrgr71/k8s-helm:v2.8.2"
    helm.tasks = [
        `helm upgrade --install --reuse-values kubecon ./src/app/web/charts/kubecon-rating-web --set image=${acrServer}/${image} --set imageTag=${imageTag}`
    ]
    ```
7. 
    ```
    var pipeline = new Group()
    pipeline.add(acr)
    pipeline.add(helm)
    pipeline.runEach()
    ```

### Setup GH Webhook

```
export GH_WEBHOOK=http://$(kubectl get svc brigade-brigade-github-gw -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):7744/events/github
echo $GH_WEBHOOK | pbcopy
```

### Push repo and run pipeline

```watch kubectl get pod```

### Kashti / brigadeterm

1. setup kashti

    * kubectl get service 
    
    * Use IP for svc and install

    ```helm install --name kashti ./charts/kashti --set service.type=LoadBalancer --set brigade.apiServer=```

    * kubectl port-forward <kashti> 80:80

2. `brigadeterm`

    https://github.com/slok/brigadeterm 
    
3. Docs https://github.com/Azure/brigade 

### Add Twitter to project / pipeline
    
* Project
    
    ```
    OWNER: chzbrgr71
    CONSUMER_KEY: 
    CONSUMER_SECRET: 
    ACCESS_TOKEN: 
    ACCESS_SECRET: 
    ```

    ```helm upgrade brig-proj-kubecon-web brigade/brigade-project -f brig-proj-kubecon.yaml```

* Pipeline 
    
    ```
    const twitter = new Job("tweet", "briaracreu.azurecr.io/chzbrgr71/twitter-t")
    twitter.storage.enabled = false

    twitter.env = {
        OWNER: project.secrets.OWNER,
        CONSUMER_KEY: project.secrets.CONSUMER_KEY,
        CONSUMER_SECRET: project.secrets.CONSUMER_SECRET,
        ACCESS_TOKEN: project.secrets.ACCESS_TOKEN,
        ACCESS_SECRET: project.secrets.ACCESS_SECRET
    }

    twitter.tasks = [
        "env2creds",
        `t update "Live Tweet from Brigade at KubeCon EU 2018! brigade rørledning færdiggjort med succes"`
    ]

    twitter.run()
    ```

### Modify app 
    
    `index.html` and `Footer.vue`

### Push repo and run pipeline

### Draft with custom gateway

http://technosophos.com/2018/04/23/building-brigade-gateways-the-easy-way.html

* Draft Setup
```
az acr login -n briaracreu -g briaracr
draft config set registry briaracreu.azurecr.io

draft pack-repo add https://github.com/technosophos/draft-brigade
```

* Setup Project

```
mkdir mygateway
cd mygateway
draft create -p brigade-gateway
draft up --auto-connect

PORT=

curl http://localhost:$PORT/healthz

curl -XPOST http://localhost:$PORT/v1/webhook/myevent/brigade-3920c21d6f4e7ca1864c701267bd873cd1f35c99b344baad56604f -d "hello"
```


