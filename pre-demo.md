# Pre-demo steps

## Containers

Build containers
```
docker build -t lachlanevenson/oscon-api-ratings:v4 app/api-ratings/
docker build -t lachlanevenson/oscon-api-sites:v4 app/api-sites/
docker build -t lachlanevenson/oscon-api-subjects:v4 app/api-sites/
```

Push containers
```
docker push lachlanevenson/oscon-api-ratings:v4
docker push lachlanevenson/oscon-api-sites:v4
docker push lachlanevenson/oscon-api-subjects:v4
```

## Kubernetes

Get a Kubernetes cluster >= 1.9

### Install Helm
```
helm init
```

## Install API deployments and backend Cosmos

* Create Mongo CosmosDB
  * Enable MongoDB Aggregation Pipeline in preview features
* Create Kubernetes secret from connection string in UI and add /webratings suffix prior to ?ssl=true in connection string (This means use the webratings DB)

```kubectl create secret generic cosmos-db-secret --from-literal=uri=''```

* Install APIs
```kubectl apply -f api.yaml```

* Create ACR secret (optional)

This step is not needed if service principal for AKS has rights

```
export ACR_SERVER=
export ACR_USER=
export ACR_PWD=

kubectl create secret docker-registry acr-secret --docker-server=$ACR_SERVER --docker-username=$ACR_USER --docker-password=$ACR_PWD --docker-email=.
```

* Create publically accessible blob store
* Upload all images from app/seed-data/PRG to the blob store
* Update URLs in  app/seed-data/subjects.json and sites.json

* Import seed data into Cosmos (data taken from connection string)

```
export MONGODB_HOST=
export MONGODB_PORT=
export MONGODB_USERNAME=
export MONGODB_PASSWORD=
export MONGODB_DBNAME=webratings

 cd /app/seed-data/ && ./import.sh
 ```


## Post-demo cleanup

Remove stuff from testing: 
* Clear brig-proj.yaml
* Clear brigade.js
* Remove web app from k8s (helm) `helm delete --purge kubecon`
* Remove brigade (helm) `helm delete --purge brigade`
* Remove kashti `helm delete --purge kashti`
* Remove brigade project (helm) `helm delete --purge brig-proj-kubecon-web`
* Delete Brigade history `kubectl delete pods,secrets -l heritage=brigade`
* Remove Github webhook
* Clear ratings collection in CosmosDB
