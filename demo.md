### brigade install

Install brigade on any Kubernetes cluster

```
helm repo add brigade https://azure.github.io/brigade
    
helm install -n brigade brigade/brigade --set rbac.enabled=false --set vacuum.enabled=false --set api.service.type=LoadBalancer --namespace=brigade
```

### brigade project

show `brig-proj.yaml`

```helm install --name brig-proj-oscon-web brigade/brigade-project -f brig-proj-oscon.yaml --namespace brigade```

### brigade.js

1. 
    ```
    //variables
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
    var image = "lachlanevenson/oscon-rating-web"
    var gitSHA = brigadeEvent.revision.commit.substr(0,7)
    var imageTag = "master-" + String(gitSHA)
    var acrImage = image + ":" + imageTag
    var helmReleaseNamespace = "default"
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
    var acr = new Job("job-runner-acr-builder")
    acr.storage.enabled = false
    acr.image = "microsoft/azure-cli:2.0.41"
    acr.tasks = [
        `cd /src/app/web`,
        `az login --service-principal -u ${azServicePrincipal} -p ${azClientSecret} --tenant ${azTenant}`,
        `az acr build -t ${acrImage} --build-arg BUILD_DATE="${String(today)}" --build-arg VCS_REF=${gitSHA} --build-arg IMAGE_TAG_REF=${imageTag} -f ./Dockerfile . -r ${acrName}`
    ]
    ```
6. 
    ```
    var helm = new Job("job-runner-helm")
    helm.storage.enabled = false
    helm.image = "lachlanevenson/k8s-helm:v2.9.1"
    helm.tasks = [
        `helm upgrade --install --reuse-values oscon ./src/app/web/charts/oscon-rating-web --set image=${acrServer}/${image} --set imageTag=${imageTag} --namespace ${helmReleaseNamespace}`
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
export GH_WEBHOOK=http://$(kubectl get svc brigade-brigade-github-gw -n brigade -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):7744/events/github
echo $GH_WEBHOOK | pbcopy
```

### Push repo and run pipeline

```watch kubectl get pod```

### Kashti / brigadeterm

1. setup kashti

    * kubectl get service 
    
    * Use IP for svc and install

    ```
    export BRIGADE_API=http://$(kubectl get svc brigade-brigade-api -n brigade -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):7745

    helm install --name kashti ./charts/kashti --set service.type=LoadBalancer --set brigade.apiServer=$(BRIGADE_API)```

    * kubectl port-forward <kashti> 80:80

2. `brigadeterm`

    https://github.com/slok/brigadeterm 
    
3. Docs https://github.com/Azure/brigade 

### Add Slack Incoming webhook to project / pipeline
    
* Project
    
    ```
    secrets:
      SLACK_WEBHOOK: <FROM SLACK INCOMING WEBHOOK>
    ```

    ```helm upgrade brig-proj-oscon-web brigade/brigade-project -f brig-proj-oscon.yaml```

* Pipeline 
    
    ```
    var slack = new Job("slack-notify", "technosophos/slack-notify:latest", ["/slack-notify"])

    pipeline.runEach().then( result => {
        slack.storage.enabled = false
        slack.env = {
          SLACK_WEBHOOK: project.secrets.SLACK_WEBHOOK,
          SLACK_USERNAME: "BrigadeBot",
          SLACK_TITLE: ":helm: upgraded oscon",
          SLACK_MESSAGE: result[1].toString(),
          SLACK_COLOR: "#0000ff"
        }
        return slack.run()
      })
    ```

### Modify app 
    
    `index.html` and `Footer.vue`

### Push repo and run pipeline

### Draft with custom gateway

http://technosophos.com/2018/04/23/building-brigade-gateways-the-easy-way.html

* Draft Setup
```
az acr login -n levooscon01 -g levooscon01
draft config set registry levooscon01.azurecr.io

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


