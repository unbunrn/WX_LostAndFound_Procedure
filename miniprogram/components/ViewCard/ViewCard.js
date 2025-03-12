Component({
  properties: {
    data:Object,
    handle: Boolean,
  },
  methods:{
    toDelete(e){
      const{id} = e.currentTarget.dataset;
      this.triggerEvent('getdelete',id)
    },
    toEdit(e){
      const{id} = e.currentTarget.dataset;
      this.triggerEvent('getedit',id)
    }
  }

})