$ (function (){
    //Used in adding Post
    ClassicEditor
        .create( document.querySelector( '#editor' ) )
        .catch( error => {
            console.log( error );
        });

        $('a.confirmDeletion').on('click', function () {
            if (!confirm('Are you sure you want to delete?'))
                return false;
        });

        $('#confirmDeletion').on('click', function () {
            if (!confirm('Are you sure you want to delete?'))
                return false;
        });

        if($("[data-fancybox]").length) {
            $("[data-fancybox]").fancybox();
        }; 
        
        const validationResult = document.getElementById("error_display");
        setTimeout(function(){validationResult.style.display = 'none'}, 5000);   

        const uploadImgVideo = document.getElementById("upload-message");
        setTimeout(function(){uploadImgVideo.style.display = 'none'}, 6000); 
})