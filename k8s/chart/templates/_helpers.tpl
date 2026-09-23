{{/*
Node affinity shared by every workload — single-node cluster, everything
pinned to the one node this chart is ever deployed to.
*/}}
{{- define "rankstack.nodeAffinity" -}}
affinity:
  nodeAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        preference:
          matchExpressions:
            - key: kubernetes.io/hostname
              operator: In
              values:
                - {{ .Values.nodeAffinityHostname }}
{{- end -}}
