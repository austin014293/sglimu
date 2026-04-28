const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xxvfgnoffomrhtxitqkj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Q4t2p9WcUBdtUxd7HYV56A_MvxnZRk9';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabase() {
    console.log('Testing banners table...');
    const { data: fetchResult, error: fetchError } = await supabase.from('banners').select('*').limit(1);
    
    if (fetchError) {
        console.error('Fetch Error:', fetchError.message);
    } else {
        console.log('Fetch Success:', fetchResult);
    }

    console.log('Testing storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.getBucket('banner-images');
    
    if (bucketError) {
        console.error('Bucket Error:', bucketError.message);
    } else {
        console.log('Bucket exists, id:', buckets.id, 'public:', buckets.public);
    }
    
    console.log('Testing Insert...');
    const { data: insertData, error: insertError } = await supabase.from('banners').insert([
        {
            type: 'slide',
            is_active: true,
            link_url: 'test_link',
            image_url: 'test_image'
        }
    ]).select();
    
    if (insertError) {
        console.error('Insert Error:', insertError.message);
    } else {
        console.log('Insert Success:', insertData);
        // Clean up test entry
        await supabase.from('banners').delete().eq('id', insertData[0].id);
    }
}

testSupabase();
